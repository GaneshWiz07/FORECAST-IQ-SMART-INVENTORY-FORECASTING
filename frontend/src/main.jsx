import React from 'react'
import ReactDOM from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

// Get Clerk publishable key from environment variables
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!clerkPubKey) {
  throw new Error('Missing Clerk Publishable Key')
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ClerkProvider 
      publishableKey={clerkPubKey}
      appearance={{
        elements: {
          rootBox: "clerk-root",
          card: "clerk-card",
          // Hide development mode indicators
          userButtonPopoverFooter: "hidden",
          organizationSwitcherPopoverFooter: "hidden",
          footer: "hidden",
          footerAction: "hidden",
          footerActionLink: "hidden",
          // Hide any development badges or indicators
          badge: "hidden",
          developerBadge: "hidden"
        },
        variables: {
          // Remove any development mode styling
          "--clerk-development-banner": "none"
        }
      }}
      localization={{
        signIn: {
          start: {
            title: "",
            subtitle: ""
          }
        }
      }}
    >
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ClerkProvider>
  </React.StrictMode>,
)
