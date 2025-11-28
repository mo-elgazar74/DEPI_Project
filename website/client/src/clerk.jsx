import { ClerkProvider } from '@clerk/clerk-react';
import React from 'react';

const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY – check client/.env');
}

export const ClerkWrapper = ({ children }) => {
  return (
    <ClerkProvider
      publishableKey={clerkKey}
      routing="path"
      appearance={{
        layout: {
          socialButtonsPlacement: 'bottom',
          socialButtonsVariant: 'iconButton',
        },
      }}
    >
      {children}
    </ClerkProvider>
  );
};