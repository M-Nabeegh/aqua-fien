import './styles/globals.css'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { AppProvider } from '../contexts/AppContext'

export const metadata = {
  title: 'AquaFine - Premium Water Supply Management',
  description: 'Professional water supply and customer management system',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AppProvider>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1 p-6 max-w-7xl mx-auto w-full">{children}</main>
            <Footer />
          </div>
        </AppProvider>
      </body>
    </html>
  )
}
