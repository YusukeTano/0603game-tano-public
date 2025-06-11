// Simple Node.js test for InputSystem
import { InputSystem } from './js/systems/input-system.js';

// Mock game object
const mockGame = {
    player: { x: 640, y: 360 }
};

try {
    console.log('🧪 Testing InputSystem...');
    
    const inputSystem = new InputSystem(mockGame);
    console.log('✅ InputSystem created successfully');
    
    console.log('📱 Mobile detected:', inputSystem.isMobile);
    console.log('🎮 Input state:', JSON.stringify(inputSystem.getInputState(), null, 2));
    
    // Test convenience methods
    console.log('🏃 Movement input:', inputSystem.getMovementInput());
    console.log('🎯 Aim input:', inputSystem.getAimInput());
    console.log('🔫 Shooting input:', inputSystem.getShootingInput());
    console.log('📊 Debug info:', inputSystem.getDebugInfo());
    
    console.log('✅ All InputSystem tests passed!');
    
} catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
}