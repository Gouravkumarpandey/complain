import React, { useEffect } from 'react';
import { Shield, ArrowLeft, Lock, Eye, FileText, Globe, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

export const PrivacyPolicy: React.FC = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navigation */}
            <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link to="/" className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                                <Shield className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold text-gray-900">QuickFix</span>
                        </Link>
                        <Link
                            to="/"
                            className="flex items-center gap-2 text-gray-600 hover:text-orange-500 transition-colors font-medium"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Home
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Header */}
            <header className="bg-white border-b border-gray-100 py-12">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-3 text-orange-500 mb-4">
                        <Lock className="w-6 h-6" />
                        <span className="font-semibold uppercase tracking-wider text-sm">Privacy Center</span>
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
                    <p className="text-lg text-gray-600">
                        Last updated: February 21, 2026. This Privacy Policy describes how QuickFix collects, uses, and shares your personal information.
                    </p>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-12 space-y-12">
                    {/* Section 1 */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
                                <Eye className="w-5 h-5" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">Information We Collect</h2>
                        </div>
                        <div className="prose prose-orange max-w-none text-gray-600 space-y-4">
                            <p>
                                We collect personal information that you provide to us directly, such as when you create an account, use our services, or communicate with us.
                            </p>
                            <ul className="list-disc pl-5 space-y-2">
                                <li><strong>Account Information:</strong> Name, email address, password, and phone number.</li>
                                <li><strong>Complaint Data:</strong> Information you provide when filing a complaint, including photos, descriptions, and location data.</li>
                                <li><strong>Payment Information:</strong> Transaction details when you subscribe to our pro or premium plans (processed securely via our payment partners).</li>
                                <li><strong>Communication Data:</strong> Records of your interactions with our support team or AI chatbot.</li>
                            </ul>
                        </div>
                    </section>

                    {/* Section 2 */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                                <FileText className="w-5 h-5" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">How We Use Your Information</h2>
                        </div>
                        <div className="prose prose-blue max-w-none text-gray-600 space-y-4">
                            <p>
                                We use the information we collect to provide, maintain, and improve our services, including:
                            </p>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Processing and managing your complaints.</li>
                                <li>Providing AI-powered insights and resolutions.</li>
                                <li>Communicating with you about your account and our services.</li>
                                <li>Personalizing your experience and providing relevant content.</li>
                                <li>Ensuring the security and integrity of our platform.</li>
                                <li>Complying with legal obligations.</li>
                            </ul>
                        </div>
                    </section>

                    {/* Section 3 */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                                <Shield className="w-5 h-5" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">Data Security</h2>
                        </div>
                        <div className="prose prose-green max-w-none text-gray-600 space-y-4">
                            <p>
                                We implement industry-standard security measures to protect your personal information from unauthorized access, disclosure, alteration, or destruction. This includes:
                            </p>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Encryption of data in transit and at rest.</li>
                                <li>Regular security audits and vulnerability assessments.</li>
                                <li>Strict access controls for our employees and contractors.</li>
                                <li>Secure data centers with physical security measures.</li>
                            </ul>
                        </div>
                    </section>

                    {/* Section 4 */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
                                <Globe className="w-5 h-5" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">Your Choices & Rights</h2>
                        </div>
                        <div className="prose prose-purple max-w-none text-gray-600 space-y-4">
                            <p>
                                You have certain rights regarding your personal information, including:
                            </p>
                            <ul className="list-disc pl-5 space-y-2">
                                <li><strong>Access:</strong> You can request a copy of the personal information we hold about you.</li>
                                <li><strong>Correction:</strong> You can ask us to correct or update inaccurate information.</li>
                                <li><strong>Deletion:</strong> You can request that we delete your personal information, subject to certain exceptions.</li>
                                <li><strong>Opt-out:</strong> You can opt-out of receiving promotional communications from us.</li>
                            </ul>
                        </div>
                    </section>

                    {/* Section 5 */}
                    <section className="bg-orange-50 rounded-xl p-8 border border-orange-100">
                        <div className="flex items-center gap-3 mb-4">
                            <Mail className="w-6 h-6 text-orange-600" />
                            <h2 className="text-xl font-bold text-gray-900">Contact Us</h2>
                        </div>
                        <p className="text-gray-600 mb-6">
                            If you have any questions or concerns about this Privacy Policy or our data practices, please contact our Privacy Team at:
                        </p>
                        <div className="space-y-2">
                            <p className="font-semibold text-gray-900">Email: <a href="mailto:privacy@quickfix.me" className="text-orange-600 hover:underline">privacy@quickfix.me</a></p>
                            <p className="text-sm text-gray-500">Address: QuickFix Inc., Legal Department, Tech City, Suite 500.</p>
                        </div>
                    </section>
                </div>
            </main>

            {/* Simple Footer */}
            <footer className="bg-white border-t border-gray-100 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500 text-sm">
                    &copy; 2026 QuickFix Inc. All rights reserved.
                </div>
            </footer>
        </div>
    );
};
