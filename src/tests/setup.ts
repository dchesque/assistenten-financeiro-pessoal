import React from 'react';
import '@testing-library/jest-dom';

// Mock do useToast
const mockToast = {
  toast: jest.fn(),
  dismiss: jest.fn(),
  update: jest.fn()
};

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => mockToast,
  toast: mockToast.toast
}));

// Mock do Supabase
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        order: jest.fn(() => Promise.resolve({
          data: [],
          error: null
        })),
        eq: jest.fn(() => ({
          order: jest.fn(() => Promise.resolve({
            data: [],
            error: null
          }))
        }))
      })),
      insert: jest.fn(() => Promise.resolve({
        data: [],
        error: null
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({
          data: [],
          error: null
        }))
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({
          data: [],
          error: null
        }))
      }))
    })),
    auth: {
      getSession: jest.fn(() => Promise.resolve({
        data: { session: null },
        error: null
      })),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn()
    }
  }
}));

// Mock do React Router
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useLocation: () => ({
    pathname: '/',
    search: '',
    hash: '',
    state: null,
    key: 'default'
  })
}));

// Mock do Framer Motion
jest.mock('framer-motion', () => ({
  motion: {
    div: (props: any) => React.createElement('div', props),
    span: (props: any) => React.createElement('span', props),
    button: (props: any) => React.createElement('button', props)
  },
  AnimatePresence: (props: any) => props.children
}));

// Mock de APIs do navegador
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock do IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() { return null; }
  disconnect() { return null; }
  unobserve() { return null; }
};

// Mock do ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() { return null; }
  disconnect() { return null; }
  unobserve() { return null; }
};

// Limpar mocks após cada teste
afterEach(() => {
  jest.clearAllMocks();
});