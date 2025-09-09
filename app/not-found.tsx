import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">Page Not Found</h2>
          <p className="text-gray-600 mb-8">
            Sorry, the page you are looking for could not be found.
          </p>
        </div>
        
        <div className="space-y-4">
          <Link 
            href="/"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Home
          </Link>
          
          <div className="text-sm text-gray-500">
            <Link href="/" className="hover:text-blue-600">Home</Link>
            {' • '}
            <Link href="/men" className="hover:text-blue-600">Men</Link>
            {' • '}
            <Link href="/women" className="hover:text-blue-600">Women</Link>
            {' • '}
            <Link href="/kids" className="hover:text-blue-600">Kids</Link>
          </div>
        </div>
      </div>
    </div>
  )
}