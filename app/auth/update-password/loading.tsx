export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-yellow-400 mb-2">Loading...</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Please wait while we load the password reset form.
          </p>
        </div>
      </div>
      <footer className="py-4 text-center text-sm text-gray-600 dark:text-gray-400">
        © {new Date().getFullYear()} GKICKS. All rights reserved.
      </footer>
    </div>
  )
}
