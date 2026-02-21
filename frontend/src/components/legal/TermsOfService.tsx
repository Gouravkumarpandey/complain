import React, { useEffect } from 'react';
import { Shield, ArrowLeft, Scale, CheckCircle2, AlertTriangle, HelpCircle, FileCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export const TermsOfService: React.FC = () => {
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
                        <Scale className="w-6 h-6" />
                        <span className="font-semibold uppercase tracking-wider text-sm">Legal Agreement</span>
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
                    <p className="text-lg text-gray-600">
                        Last updated: February 21, 2026. Please read these terms carefully before using the QuickFix platform.
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
                                <CheckCircle2 className="w-5 h-5" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">Acceptance of Terms</h2>
                        </div>
                        <div className="prose prose-orange max-w-none text-gray-600 space-y-4">
                            <p>
                                By accessing or using the QuickFix platform, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any part of these terms, you are prohibited from using or accessing our site.
                            </p>
                            <p>
                                We reserve the right to modify these terms at any time. We will notify you of any changes by posting the new terms on this page and updating the "Last updated" date.
                            </p>
                        </div>
                    </section>

                    {/* Section 2 */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                                <FileCheck className="w-5 h-5" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">User Responsibilities</h2>
                        </div>
                        <div className="prose prose-blue max-w-none text-gray-600 space-y-4">
                            <p>
                                When using QuickFix, you agree to:
                            </p>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Provide accurate, current, and complete information during the registration process.</li>
                                <li>Maintain the security of your password and accept all risks of unauthorized access to your account.</li>
                                <li>Not use the platform for any illegal or unauthorized purpose.</li>
                                <li>Not upload or transmit any viruses, malware, or other harmful code.</li>
                                <li>Not engage in any activity that interferes with or disrupts the platform.</li>
                            </ul>
                        </div>
                    </section>

                    {/* Section 3 */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">Limitations of Liability</h2>
                        </div>
                        <div className="prose prose-red max-w-none text-gray-600 space-y-4">
                            <p>
                                To the fullest extent permitted by law, QuickFix shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses, resulting from:
                            </p>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Your access to or use of or inability to access or use the services.</li>
                                <li>Any conduct or content of any third party on the services.</li>
                                <li>Any content obtained from the services.</li>
                                <li>Unauthorized access, use, or alteration of your transmissions or content.</li>
                            </ul>
                        </div>
                    </section>

                    {/* Section 4 */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
                                <HelpCircle className="w-5 h-5" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">Subscription & Payments</h2>
                        </div>
                        <div className="prose prose-purple max-w-none text-gray-600 space-y-4">
                            <p>
                                Some parts of the Service are billed on a subscription basis. You will be billed in advance on a recurring and periodic basis.
                            </p>
                            <ul className="list-disc pl-5 space-y-2">
                                <li><strong>Free Plan:</strong> Limited features, no cost.</li>
                                <li><strong>Paid Plans:</strong> Billed monthly or annually as specified during purchase.</li>
                                <li><strong>Refunds:</strong> Refund policies are dictated by the specific plan and region. Please contact support for details.</li>
                            </ul>
                        </div>
                    </section>

                    {/* Section 5 - Final note */}
                    <section className="bg-gray-50 rounded-xl p-8 border border-gray-200">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Governing Law</h2>
                        <p className="text-gray-600">
                            These Terms shall be governed and construed in accordance with the laws of the jurisdiction in which QuickFix operates, without regard to its conflict of law provisions. Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.
                        </p>
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
