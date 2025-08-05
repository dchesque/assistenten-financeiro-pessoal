interface BlurBackgroundProps {
  variant?: 'page' | 'modal' | 'sidebar';
  intensity?: 'light' | 'medium' | 'strong';
}

export function BlurBackground({ variant = 'page', intensity = 'medium' }: BlurBackgroundProps) {
  // Configurações baseadas na variante
  const getConfig = () => {
    switch (variant) {
      case 'page':
        return {
          elements: [
            {
              position: 'absolute -top-32 -right-32',
              size: 'w-96 h-96',
              color: 'bg-gradient-to-r from-blue-400/20 to-purple-500/20',
              blur: 'blur-3xl',
              animation: 'animate-pulse'
            },
            {
              position: 'absolute -bottom-32 -left-32',
              size: 'w-96 h-96',
              color: 'bg-gradient-to-r from-pink-400/20 to-orange-400/20',
              blur: 'blur-3xl',
              animation: 'animate-pulse',
              delay: 'animation-delay-[2s]'
            },
            {
              position: 'absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2',
              size: 'w-80 h-80',
              color: 'bg-gradient-to-r from-green-400/10 to-blue-400/10',
              blur: 'blur-3xl',
              animation: 'animate-pulse',
              delay: 'animation-delay-[4s]'
            }
          ]
        };
      
      case 'modal':
        return {
          elements: [
            {
              position: 'absolute -top-16 -right-16',
              size: 'w-48 h-48',
              color: 'bg-gradient-to-r from-purple-400/15 to-blue-400/15',
              blur: 'blur-2xl',
              animation: 'animate-pulse'
            },
            {
              position: 'absolute -bottom-16 -left-16',
              size: 'w-48 h-48',
              color: 'bg-gradient-to-r from-pink-400/15 to-orange-400/15',
              blur: 'blur-2xl',
              animation: 'animate-pulse',
              delay: 'animation-delay-[1s]'
            }
          ]
        };
      
      case 'sidebar':
        return {
          elements: [
            {
              position: 'absolute top-0 left-0',
              size: 'w-full h-32',
              color: 'bg-gradient-to-b from-purple-500/10 to-transparent',
              blur: '',
              animation: ''
            },
            {
              position: 'absolute bottom-0 right-0',
              size: 'w-32 h-32',
              color: 'bg-gradient-to-t from-blue-500/10 to-transparent',
              blur: '',
              animation: ''
            }
          ]
        };
      
      default:
        return { elements: [] };
    }
  };

  const config = getConfig();

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {config.elements.map((element, index) => (
        <div
          key={index}
          className={`
            ${element.position}
            ${element.size}
            ${element.color}
            ${element.blur}
            ${element.animation}
            ${element.delay || ''}
            rounded-full
          `}
          style={{
            animationDelay: element.delay?.includes('[') 
              ? element.delay.match(/\[(.+?)\]/)?.[1] || '0s'
              : '0s'
          }}
        />
      ))}
    </div>
  );
}