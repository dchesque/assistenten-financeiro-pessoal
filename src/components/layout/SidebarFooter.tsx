import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { SubscriptionStatus } from './SubscriptionStatus';
import {
  Building2,
  Settings,
  LogOut,
  ChevronUp,
  User,
  CreditCard
} from 'lucide-react';

interface SidebarFooterProps {
  expanded: boolean;
  mobile?: boolean;
}

export function SidebarFooter({ expanded, mobile = false }: SidebarFooterProps) {
  const [userDropdown, setUserDropdown] = useState(false);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    setUserDropdown(false);
  };

  const handleMenuClick = (route: string) => {
    navigate(route);
    setUserDropdown(false);
  };
  
  return (
    <div className={`border-t border-gray-700/50 ${expanded || mobile ? 'p-4' : 'p-2'}`}>
      <div className="relative">
        <button 
          onClick={() => setUserDropdown(!userDropdown)}
          className={`w-full flex items-center ${expanded || mobile ? 'space-x-3 px-4 py-3' : 'justify-center px-2 py-3'} rounded-xl hover:bg-gray-800/50 transition-all duration-200 relative group hover-scale`}
        >
          <div className={`${expanded || mobile ? 'w-10 h-10' : 'w-8 h-8'} bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg`}>
            <span className={`text-white font-medium ${expanded || mobile ? 'text-sm' : 'text-xs'}`}>
              {user?.user_metadata?.nome ? 
                user.user_metadata.nome.charAt(0).toUpperCase() : 
                user?.email?.charAt(0).toUpperCase() || 'U'
              }
            </span>
          </div>
          
          {(expanded || mobile) && (
            <>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-white">
                  {user?.user_metadata?.nome || user?.email?.split('@')[0] || 'Usuário'}
                </p>
                <p className="text-xs text-gray-300">{user?.email}</p>
              </div>
              <ChevronUp className={`w-4 h-4 text-gray-300 transition-transform ${userDropdown ? 'rotate-180' : ''}`} />
            </>
          )}
          
          {!expanded && !mobile && (
            <div className="absolute left-full ml-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 border border-gray-700 shadow-xl">
              <div className="font-medium">
                {user?.user_metadata?.nome || user?.email?.split('@')[0] || 'Usuário'}
              </div>
              <div className="text-xs text-gray-300">{user?.email}</div>
            </div>
          )}
        </button>
        
        {/* Dropdown do Usuário */}
        {userDropdown && (
          <div className={`absolute bottom-full mb-2 min-w-[200px] z-50 animate-scale-in ${
            expanded || mobile ? 'right-0' : 'left-full ml-2'
          }`}>
            <div className="bg-slate-800/95 backdrop-blur-xl border border-white/10 rounded-xl p-2 shadow-2xl">
              
              {/* Meu Perfil */}
              <button
                onClick={() => handleMenuClick('/meu-perfil')}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-white hover:bg-white/10 transition-colors duration-200"
              >
                <User className="w-4 h-4 text-purple-500" />
                <span className="text-sm">Meu Perfil</span>
              </button>

              {/* Assinatura */}
              <button
                onClick={() => handleMenuClick('/assinatura')}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-white hover:bg-white/10 transition-colors duration-200"
              >
                <CreditCard className="w-4 h-4 text-amber-500" />
                <span className="text-sm">Assinatura</span>
              </button>

              {/* Administrador */}
              <button
                onClick={() => handleMenuClick('/administrador')}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-white hover:bg-white/10 transition-colors duration-200"
              >
                <Settings className="w-4 h-4 text-gray-500" />
                <span className="text-sm">Administrador</span>
              </button>

              {/* Separador */}
              <div className="border-t border-white/10 mt-2 pt-2">
                {/* Sair */}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-white hover:bg-white/10 transition-colors duration-200"
                >
                  <LogOut className="w-4 h-4 text-red-500" />
                  <span className="text-sm">Sair</span>
                </button>
              </div>
              
            </div>
          </div>
        )}
      </div>
      
      {/* Status da Assinatura - Abaixo do usuário */}
      <SubscriptionStatus expanded={expanded} mobile={mobile} />
    </div>
  );
}