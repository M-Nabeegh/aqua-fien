export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl text-white">📞</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Contact Support</h2>
            <p className="text-gray-600 mt-2">Need help with your account?</p>
          </div>

          {/* Contact Information */}
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">
                Password Recovery Support
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">👨‍💼</span>
                  <div>
                    <p className="font-medium text-gray-900">Shilly</p>
                    <p className="text-sm text-gray-600">System Administrator</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <span className="text-2xl mr-3">📱</span>
                  <div>
                    <p className="font-medium text-gray-900">Phone</p>
                    <p className="text-sm text-gray-600">Contact for phone number</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <span className="text-2xl mr-3">💬</span>
                  <div>
                    <p className="font-medium text-gray-900">WhatsApp</p>
                    <p className="text-sm text-gray-600">Available for quick support</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <span className="text-yellow-600 text-xl mr-3">⚠️</span>
                <div>
                  <h4 className="text-sm font-medium text-yellow-800">
                    Security Notice
                  </h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    For security reasons, password resets must be done through direct contact with the system administrator.
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center">
              <a
                href="/login"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                ← Back to Login
              </a>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-500">
              © 2025 AquaFine Water Management System
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
