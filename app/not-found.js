import Link from 'next/link';

export default function NotFound() {
	return (
		<main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
			<div className="w-full max-w-3xl bg-white rounded-2xl shadow-md p-8">
				<div className="flex flex-col items-center text-center">
					<div className="w-28 h-28 rounded-full bg-[#FFF4ED] flex items-center justify-center mb-6">
						<span className="text-4xl font-extrabold text-[#E05305]">404</span>
					</div>

					<h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Page not found</h1>
					<p className="text-gray-600 mb-6">We can&apos;t find the page you&apos;re looking for. It might have been removed, renamed, or did not exist in the first place.</p>

					<div className="flex gap-3 mb-6">
						<Link href="/" className="inline-flex items-center justify-center px-5 py-3 bg-[#E05305] text-white rounded-md font-semibold hover:bg-[#c84a04]">
							Go to Home
						</Link>

						<Link href="/contact" className="inline-flex items-center justify-center px-5 py-3 border border-gray-200 rounded-md text-gray-700 hover:bg-gray-50">
							Contact Support
						</Link>
					</div>

					<div className="w-full">
						<h2 className="text-sm text-gray-500 mb-3">Helpful links</h2>
						<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
							<Link href="/services" className="p-3 bg-white border rounded-md text-sm text-gray-700 hover:bg-[#FFF1E9]">Services</Link>
							<Link href="/case-study" className="p-3 bg-white border rounded-md text-sm text-gray-700 hover:bg-[#FFF1E9]">Case Studies</Link>
							<Link href="/resources" className="p-3 bg-white border rounded-md text-sm text-gray-700 hover:bg-[#FFF1E9]">Resources</Link>
							<Link href="/contact" className="p-3 bg-white border rounded-md text-sm text-gray-700 hover:bg-[#FFF1E9]">Contact</Link>
						</div>
					</div>
				</div>
			</div>
		</main>
	);
}
