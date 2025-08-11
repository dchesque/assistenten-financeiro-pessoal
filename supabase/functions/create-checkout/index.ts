import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// Importar middlewares de segurança
import { 
  applyMiddleware, 
  rateLimit, 
  requireAuth,
  validateInput,
  logSuspiciousActivity 
} from "../_shared/middleware.ts";
import { createCheckoutSchema } from "../_shared/schemas.ts";
import { 
  handleCORS, 
  errorResponse, 
  successResponse, 
  logStep,
  validateEnvironment,
  sanitizeForLogging,
  validatePayloadSize
} from "../_shared/utils.ts";

const FUNCTION_NAME = "create-checkout";

serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCORS(req);
  if (corsResponse) return corsResponse;

  try {
    // Validar tamanho do payload
    const sizeValidation = await validatePayloadSize(req, 10 * 1024); // 10KB max
    if (!sizeValidation.valid) {
      return errorResponse(
        "Payload Too Large",
        sizeValidation.error!,
        "PAYLOAD_TOO_LARGE",
        413
      );
    }

    // Validar variáveis de ambiente obrigatórias
    validateEnvironment(["SUPABASE_URL", "SUPABASE_ANON_KEY", "STRIPE_SECRET_KEY"]);
    logStep(FUNCTION_NAME, "Environment validated");

    // Aplicar middlewares de segurança
    const middlewareResult = await applyMiddleware(req, [
      // Rate limiting: 10 requests por minuto por IP
      rateLimit({
        windowMs: 60 * 1000, // 1 minuto
        maxRequests: 10,
        keyGenerator: (req) => `checkout:${req.clientIp}`
      }),
      // Rate limiting adicional por usuário: 20 requests por hora
      rateLimit({
        windowMs: 60 * 60 * 1000, // 1 hora
        maxRequests: 20,
        keyGenerator: (req) => `checkout:user:${req.userId || "anonymous"}`
      }),
      // Autenticação obrigatória
      async (req) => {
        const authResult = await requireAuth()(req);
        if (!authResult.authenticated) {
          return authResult.response!;
        }
        req.userId = authResult.userId;
        return null;
      }
    ]);

    if (!middlewareResult.success) {
      logSuspiciousActivity("MIDDLEWARE_BLOCKED", {
        ip: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
        url: req.url,
        method: req.method,
        userAgent: req.headers.get("user-agent")
      });
      return middlewareResult.response!;
    }

    const secureReq = middlewareResult.request!;
    logStep(FUNCTION_NAME, "Middleware passed", { userId: secureReq.userId });

    // Para este endpoint, vamos usar um schema simplificado que aceita uma sessão vazia
    // já que o produto é fixo
    const emptySchema = { safeParse: () => ({ success: true, data: {} }) };
    const validationResult = { valid: true, data: {} };

    logStep(FUNCTION_NAME, "Using fixed product configuration");

    // Criar cliente Supabase para autenticação
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );

    // Obter token de autenticação e validar usuário
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) {
      logStep(FUNCTION_NAME, "Auth error", { error: userError.message }, "error");
      return errorResponse(
        "Authentication Error",
        `Erro de autenticação: ${userError.message}`,
        "AUTH_ERROR",
        401
      );
    }

    const user = userData.user;
    if (!user?.email) {
      logStep(FUNCTION_NAME, "Invalid user", { userId: user?.id }, "warn");
      return errorResponse(
        "Invalid User",
        "Usuário não autenticado ou email não disponível",
        "INVALID_USER",
        401
      );
    }

    logStep(FUNCTION_NAME, "User authenticated", { 
      userId: user.id, 
      email: user.email 
    });

    // Inicializar Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { 
      apiVersion: "2023-10-16" 
    });

    // Verificar se cliente já existe no Stripe
    const customers = await stripe.customers.list({ 
      email: user.email, 
      limit: 1 
    });
    
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep(FUNCTION_NAME, "Found existing customer", { customerId });
    } else {
      logStep(FUNCTION_NAME, "No existing customer found, will create during checkout");
    }

    // Validar URLs de sucesso e cancelamento
    const origin = req.headers.get("origin") || "http://localhost:3000";
    const successUrl = `${origin}/assinatura?success=true`;
    const cancelUrl = `${origin}/assinatura?canceled=true`;

    logStep(FUNCTION_NAME, "Creating checkout session", {
      customerId,
      successUrl,
      cancelUrl
    });

    // Criar sessão de checkout com configuração fixa
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: { 
              name: "Assinatura Premium",
              description: "Acesso completo a todos os recursos do sistema" 
            },
            unit_amount: 2990, // R$ 29,90
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      automatic_tax: { enabled: false },
      metadata: {
        user_id: user.id,
        function: FUNCTION_NAME
      }
    });

    logStep(FUNCTION_NAME, "Checkout session created", { 
      sessionId: session.id,
      url: session.url 
    });

    return successResponse({
      url: session.url,
      session_id: session.id
    }, "Sessão de checkout criada com sucesso");

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep(FUNCTION_NAME, "Unexpected error", { 
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    }, "error");

    logSuspiciousActivity("FUNCTION_ERROR", {
      function: FUNCTION_NAME,
      error: errorMessage,
      url: req.url,
      method: req.method
    });

    return errorResponse(
      "Internal Server Error",
      "Erro interno no servidor. Tente novamente.",
      "INTERNAL_ERROR",
      500,
      { timestamp: new Date().toISOString() }
    );
  }
});