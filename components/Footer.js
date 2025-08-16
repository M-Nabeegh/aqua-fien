export default function Footer() {
  return (
    <footer className="bg-black text-white py-8 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="mb-4">
            <p className="text-lg font-medium">
              Designed & Developed by <span className="text-blue-400 font-bold">Shilly Solutions Ltd</span>
            </p>
          </div>
          <div className="border-t border-gray-700 pt-4">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} AquaFine Water Supply Management System. All rights reserved.
            </p>
            <p className="text-gray-500 text-xs mt-1">
              Professional water supply and customer management solution
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
