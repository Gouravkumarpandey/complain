import dotenv from 'dotenv';
dotenv.config();

console.log('--- Checking Anthropic Service ---');
console.log('ANTHROPIC_API_KEY:', process.env.ANTHROPIC_API_KEY ? 'Present' : 'Missing',
    process.env.ANTHROPIC_API_KEY ? `(...${process.env.ANTHROPIC_API_KEY.slice(-6)})` : '');

// Using await import for fresh load
(async () => {
    try {
        const anthropicService = (await import('./src/services/anthropicService.js')).default;
        console.log('Service loaded successfully.');

        console.log('\n--- Test 1: Chat ---');
        const chatRes = await anthropicService.chat('Hello, are you Claude?');
        if (chatRes.success) {
            console.log('✅ Chat Success!');
            console.log('Model:', chatRes.model);
            console.log('Response:', chatRes.response.substring(0, 50).replace(/\n/g, ' ') + '...');
        } else {
            console.log('❌ Chat Failed:', chatRes.error);
        }

        console.log('\n--- Test 2: Ticket Assignment (Simulation) ---');
        const assignmentRes = await anthropicService.assignTicketToAgent(
            { title: 'Broken Internet', description: 'No connection', priority: 'High', category: 'Technical' },
            [{ id: 'agent1', name: 'John Doe', activeTickets: 2 }]
        );
        if (assignmentRes.success) {
            console.log('✅ Assignment Success!');
            console.log('Selected Agent:', assignmentRes.agent.name);
        } else {
            console.log('❌ Assignment Failed:', assignmentRes.message);
        }
    } catch (error) {
        console.error('Test Script Error:', error);
    }
})();
