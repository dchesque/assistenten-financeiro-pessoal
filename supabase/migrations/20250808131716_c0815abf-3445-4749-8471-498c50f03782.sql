-- Enum para roles de usuário
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Enum para planos de usuário
CREATE TYPE public.user_plan AS ENUM ('trial', 'free', 'premium');

-- Enum para status de assinatura
CREATE TYPE public.subscription_status AS ENUM ('active', 'inactive', 'cancelled', 'expired');

-- Tabela de perfis de usuário
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  phone TEXT NOT NULL UNIQUE,
  name TEXT,
  email TEXT,
  role app_role NOT NULL DEFAULT 'user',
  plan user_plan NOT NULL DEFAULT 'trial',
  subscription_status subscription_status NOT NULL DEFAULT 'active',
  trial_ends_at TIMESTAMPTZ,
  subscription_ends_at TIMESTAMPTZ,
  features_limit JSONB NOT NULL DEFAULT '{
    "contas_pagar": 50,
    "fornecedores": 20,
    "categorias": 10,
    "relatorios": true,
    "exportacao": false,
    "backup": false
  }'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ativo BOOLEAN NOT NULL DEFAULT TRUE
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies para profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.role = 'admin'
  )
);

CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.role = 'admin'
  )
);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Função para criar perfil automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id,
    phone,
    name,
    plan,
    trial_ends_at,
    features_limit
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.phone, ''),
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    'trial',
    NOW() + INTERVAL '14 days',
    CASE 
      WHEN NEW.raw_user_meta_data->>'role' = 'admin' THEN '{
        "contas_pagar": -1,
        "fornecedores": -1,
        "categorias": -1,
        "relatorios": true,
        "exportacao": true,
        "backup": true
      }'::jsonb
      ELSE '{
        "contas_pagar": 50,
        "fornecedores": 20,
        "categorias": 10,
        "relatorios": true,
        "exportacao": false,
        "backup": false
      }'::jsonb
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil automaticamente
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Função para verificar role do usuário
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Função para verificar limites do plano
CREATE OR REPLACE FUNCTION public.check_feature_limit(_user_id UUID, _feature TEXT, _current_count INTEGER)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    CASE 
      WHEN (features_limit->_feature)::integer = -1 THEN TRUE
      ELSE _current_count < (features_limit->_feature)::integer
    END
  FROM public.profiles
  WHERE user_id = _user_id
$$;