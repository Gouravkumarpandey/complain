import dotenv from 'dotenv';
// Load env before imports
dotenv.config();

// Dynamic imports function
async function runChecks() {
    console.log('--- AI Configuration Check ---');
    console.log('Anthropic Key Available:', !!process.env.ANTHROPIC_API_KEY);
    console.log('Gemini Key Available:', !!process.env.GEMINI_API_KEY);

    // Import services dynamically
    let anthropicService, geminiService;
    try {
        anthropicService = (await import('./src/services/anthropicService.js')).default;
    } catch (e) {
        console.log('⚠️ Could not load Anthropic Service:', e.message);
    }

    try {
        geminiService = (await import('./src/services/geminiService.js')).default;
    } catch (e) {
        console.log('⚠️ Could not load Gemini Service:', e.message);
    }

    console.log('\n--- 1. Testing Gemini (Proposed Replacement) ---');
    if (geminiService) {
        try {
            const res = await geminiService.chat('Hello! Are you operational?');
            if (res.success) {
                console.log('✅ Gemini is working correctly.');
                console.log('Model:', res.model);
                console.log('Response:', res.response.substring(0, 60).replace(/\n/g, ' ') + '...');
            } else {
                console.log('❌ Gemini failed:', res.error);
            }
        } catch (e) {
            console.log('❌ Gemini Exception:', e.message);
        }
    } else {
        console.log('Skipping Gemini test (service not loaded)');
    }

    // Check Anthropic Service (Replaces DeepSeek)
    console.log('\n--- 2. Testing Anthropic Service (New Default) ---');
    if (anthropicService) {
        try {
            if (!process.env.ANTHROPIC_API_KEY) {
                console.log('❌ ANTHROPIC_API_KEY is missing in env.');
            } else {
                console.log('✅ ANTHROPIC_API_KEY is configured.');
                console.log('⏳ Testing Anthropic Chat...');

                const res = await anthropicService.chat('Hello, are you online?', [], { userName: 'Admin' });

                if (res.success) {
                    console.log('✅ Anthropic is working.');
                    console.log('   Response:', res.response.substring(0, 50) + '...');
                    console.log('   Model:', res.model);
                } else {
                    console.log('❌ Anthropic is failing or using fallback.');
                    console.log('   Error:', res.error);
                    if (res.fallback) console.log('   (Using fallback response)');
                }
            }
        } catch (e) {
            console.log('❌ Anthropic Exception:', e.message);
        }
    } else {
        console.log('Skipping Anthropic test (service not loaded)');
    }
}

runChecks();
