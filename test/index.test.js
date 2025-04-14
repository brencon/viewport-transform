const { ViewportTransform, getRequestAnimationFrame, getCancelAnimationFrame } = require('../src/index');

describe('ViewportTransform', () => {
  let transformer;
  
  // Original image: 1000x800
  // Viewport: 500x400
  beforeEach(() => {
    transformer = new ViewportTransform({
      imageWidth: 1000,
      imageHeight: 800,
      viewportWidth: 500,
      viewportHeight: 400
    });
  });
  
  describe('initialization', () => {
    test('should initialize with default zoom and center position', () => {
      expect(transformer.getZoom()).toBe(1);
      
      const center = transformer.getCenter();
      expect(center.x).toBe(500); // Middle of image
      expect(center.y).toBe(400); // Middle of image
      
      const visibleRect = transformer.getVisibleRect();
      expect(visibleRect.x).toBe(250); // Centered so 500-(500/2)
      expect(visibleRect.y).toBe(200); // Centered so 400-(400/2)
      expect(visibleRect.width).toBe(500);
      expect(visibleRect.height).toBe(400);
    });
    
    test('should handle different image and viewport aspect ratios', () => {
      // Wide image with narrow viewport
      const wideTransformer = new ViewportTransform({
        imageWidth: 2000,
        imageHeight: 500,
        viewportWidth: 300,
        viewportHeight: 400
      });
      
      const visibleRect = wideTransformer.getVisibleRect();
      expect(visibleRect.width).toBe(300);
      expect(visibleRect.height).toBe(400);
    });
  });
  
  describe('zoom operations', () => {
    test('should update zoom and maintain center', () => {
      transformer.setZoom(2); // 2x zoom
      
      expect(transformer.getZoom()).toBe(2);
      
      const center = transformer.getCenter();
      expect(center.x).toBe(500); // Still centered
      expect(center.y).toBe(400);
      
      const visibleRect = transformer.getVisibleRect();
      expect(visibleRect.width).toBe(250); // Half the size due to 2x zoom
      expect(visibleRect.height).toBe(200);
      expect(visibleRect.x).toBe(375); // 500-(250/2)
      expect(visibleRect.y).toBe(300); // 400-(200/2)
    });
    
    test('should enforce minimum zoom level', () => {
      transformer.setZoom(0.1); // Too small
      expect(transformer.getZoom()).toBe(transformer.MIN_ZOOM);
    });
    
    test('should enforce maximum zoom level', () => {
      transformer.setZoom(100); // Too large
      expect(transformer.getZoom()).toBe(transformer.MAX_ZOOM);
    });
  });
  
  describe('pan operations', () => {
    test('should update center position', () => {
      transformer.setCenter(300, 200);
      
      const center = transformer.getCenter();
      expect(center.x).toBe(300);
      expect(center.y).toBe(200);
      
      const visibleRect = transformer.getVisibleRect();
      expect(visibleRect.x).toBe(50); // 300-(500/2)
      expect(visibleRect.y).toBe(0); // 200-(400/2), clamped to 0
    });
    
    test('should prevent panning outside image bounds', () => {
      // Try to pan past the left edge
      transformer.setCenter(-100, 400);
      
      const center = transformer.getCenter();
      expect(center.x).toBe(250); // Clamped to minimum valid center
      
      // Try to pan past the right edge
      transformer.setCenter(1100, 400);
      expect(transformer.getCenter().x).toBe(750); // Clamped to maximum valid center
    });
  });
  
  describe('coordinate conversion', () => {
    test('should convert from viewport to image coordinates', () => {
      // Middle of viewport maps to center of visible area
      const imageCoords = transformer.viewportToImage(250, 200);
      expect(imageCoords.x).toBe(500);
      expect(imageCoords.y).toBe(400);
      
      // Top-left of viewport
      const topLeft = transformer.viewportToImage(0, 0);
      expect(topLeft.x).toBe(250);
      expect(topLeft.y).toBe(200);
      
      // With zoom
      transformer.setZoom(2);
      const zoomedCoords = transformer.viewportToImage(250, 200);
      expect(zoomedCoords.x).toBe(500);
      expect(zoomedCoords.y).toBe(400);
    });
    
    test('should convert from image to viewport coordinates', () => {
      // Center of image
      const viewportCoords = transformer.imageToViewport(500, 400);
      expect(viewportCoords.x).toBe(250);
      expect(viewportCoords.y).toBe(200);
      
      // With zoom
      transformer.setZoom(2);
      const zoomedViewportCoords = transformer.imageToViewport(500, 400);
      expect(zoomedViewportCoords.x).toBe(250);
      expect(zoomedViewportCoords.y).toBe(200);
      
      // Points outside the visible area should still map correctly
      const outsidePoint = transformer.imageToViewport(1000, 800);
      expect(outsidePoint.x).toBe(500);
      expect(outsidePoint.y).toBe(400);
    });
  });
  
  describe('crop parameters', () => {
    test('should generate crop parameters from current viewport', () => {
      transformer.setZoom(2);
      transformer.setCenter(600, 500);
      
      const cropParams = transformer.getCropParameters();
      expect(cropParams.x).toBe(475); // 600-(250/2)
      expect(cropParams.y).toBe(400); // 500-(200/2)
      expect(cropParams.width).toBe(250);
      expect(cropParams.height).toBe(200);
    });
    
    test('should handle crop at image boundaries', () => {
      // Position viewport at bottom-right corner
      transformer.setCenter(900, 700);
      
      const cropParams = transformer.getCropParameters();
      // Should be clamped within image bounds
      expect(cropParams.x + cropParams.width).toBeLessThanOrEqual(1000);
      expect(cropParams.y + cropParams.height).toBeLessThanOrEqual(800);
    });
  });
  
  describe('visible percentage', () => {
    test('should calculate percentage of image visible in viewport', () => {
      // At zoom=1 with our test dimensions, we see 500x400 of 1000x800
      expect(transformer.getVisiblePercentage()).toBeCloseTo(25, 1); // 25%
      
      transformer.setZoom(2);
      expect(transformer.getVisiblePercentage()).toBeCloseTo(6.25, 1); // 6.25%
      
      transformer.setZoom(0.5);
      // Can't see more than 100% of the image
      expect(transformer.getVisiblePercentage()).toBeLessThanOrEqual(100);
    });
  });

  describe('enhanced zoom methods', () => {
    test('should zoom in by the specified factor', () => {
      transformer.setZoom(1);
      transformer.zoomIn(); // Default factor of 1.2
      expect(transformer.getZoom()).toBeCloseTo(1.2, 1);
      
      transformer.zoomIn(2); // Custom factor
      expect(transformer.getZoom()).toBeCloseTo(2.4, 1);
    });
    
    test('should zoom out by the specified factor', () => {
      transformer.setZoom(4);
      transformer.zoomOut(); // Default factor of 1.2
      expect(transformer.getZoom()).toBeCloseTo(3.33, 1);
      
      transformer.zoomOut(2); // Custom factor
      expect(transformer.getZoom()).toBeCloseTo(1.667, 1);
    });
    
    test('should respect zoom limits when zooming in/out', () => {
      // Test MAX_ZOOM limit
      transformer.setZoom(transformer.MAX_ZOOM / 2);
      transformer.zoomIn(3); // Would go beyond MAX_ZOOM
      expect(transformer.getZoom()).toBe(transformer.MAX_ZOOM);
      
      // Test MIN_ZOOM limit
      transformer.setZoom(transformer.MIN_ZOOM * 2);
      transformer.zoomOut(3); // Would go below MIN_ZOOM
      expect(transformer.getZoom()).toBe(transformer.MIN_ZOOM);
    });
  });
  
  describe('reset method', () => {
    test('should reset zoom and center position to initial values', () => {
      // Change zoom and position
      transformer.setZoom(2.5);
      transformer.setCenter(300, 200);
      
      // Verify changes took effect
      expect(transformer.getZoom()).toBe(2.5);
      expect(transformer.getCenter().x).toBe(300);
      
      // Reset
      transformer.reset();
      
      // Verify reset to defaults
      expect(transformer.getZoom()).toBe(1);
      expect(transformer.getCenter().x).toBe(500); // Image center
      expect(transformer.getCenter().y).toBe(400); // Image center
    });
  });
  
  describe('event system', () => {
    test('should emit events when zoom changes', () => {
      const mockCallback = jest.fn();
      transformer.addEventListener(ViewportTransform.EVENTS.ZOOM_CHANGE, mockCallback);
      
      // Change zoom to trigger event
      transformer.setZoom(2);
      
      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockCallback).toHaveBeenCalledWith({
        oldZoom: 1, // Default was 1
        newZoom: 2
      });
      
      // Setting the same zoom should not trigger event
      transformer.setZoom(2);
      expect(mockCallback).toHaveBeenCalledTimes(1);
    });
    
    test('should emit events when center changes', () => {
      const mockCallback = jest.fn();
      transformer.addEventListener(ViewportTransform.EVENTS.CENTER_CHANGE, mockCallback);
      
      // Change center to trigger event
      transformer.setCenter(400, 300);
      
      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockCallback).toHaveBeenCalledWith({
        oldCenter: { x: 500, y: 400 }, // Default center
        newCenter: { x: 400, y: 300 }
      });
      
      // Setting the same center should not trigger event
      transformer.setCenter(400, 300);
      expect(mockCallback).toHaveBeenCalledTimes(1);
    });
    
    test('should emit event when reset is called', () => {
      const mockCallback = jest.fn();
      
      // Set non-default values
      transformer.setZoom(2);
      transformer.setCenter(400, 300);
      
      // Add listener after changing values
      transformer.addEventListener(ViewportTransform.EVENTS.RESET, mockCallback);
      
      // Reset
      transformer.reset();
      
      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockCallback).toHaveBeenCalledWith({
        oldZoom: 2,
        newZoom: 1,
        oldCenter: { x: 400, y: 300 },
        newCenter: { x: 500, y: 400 }
      });
    });
    
    test('should allow removing event listeners', () => {
      const mockCallback = jest.fn();
      
      // Add listener
      transformer.addEventListener(ViewportTransform.EVENTS.ZOOM_CHANGE, mockCallback);
      
      // Should trigger event
      transformer.setZoom(2);
      expect(mockCallback).toHaveBeenCalledTimes(1);
      
      // Remove listener
      transformer.removeEventListener(ViewportTransform.EVENTS.ZOOM_CHANGE, mockCallback);
      
      // Should not trigger event anymore
      transformer.setZoom(3);
      expect(mockCallback).toHaveBeenCalledTimes(1); // Still just 1 call
    });
  });
  
  describe('animation', () => {
    beforeEach(() => {
      // Mock timers and animation frames
      jest.useFakeTimers();
      
      // Mock requestAnimationFrame
      global.requestAnimationFrame = callback => {
        return setTimeout(callback, 16);
      };
      
      // Mock cancelAnimationFrame
      global.cancelAnimationFrame = timeoutId => {
        clearTimeout(timeoutId);
      };
      
      // Reset transformer
      transformer.reset();
    });
    
    afterEach(() => {
      jest.useRealTimers();
      delete global.requestAnimationFrame;
      delete global.cancelAnimationFrame;
    });
    
    test('should animate to target zoom and center', () => {
      const animationStartMock = jest.fn();
      const animationTickMock = jest.fn();
      const animationEndMock = jest.fn();
      
      transformer.addEventListener(ViewportTransform.EVENTS.ANIMATION_START, animationStartMock);
      transformer.addEventListener(ViewportTransform.EVENTS.ANIMATION_TICK, animationTickMock);
      transformer.addEventListener(ViewportTransform.EVENTS.ANIMATION_END, animationEndMock);
      
      // Start animation to double zoom and move center
      transformer.animateTo({
        targetZoom: 2,
        targetCenterX: 600,
        targetCenterY: 500,
        durationMs: 300
      });
      
      // Verify animation started
      expect(animationStartMock).toHaveBeenCalledTimes(1);
      expect(animationStartMock).toHaveBeenCalledWith({
        startZoom: 1,
        targetZoom: 2,
        startCenter: { x: 500, y: 400 },
        targetCenter: { x: 600, y: 500 },
        durationMs: 300
      });
      
      // Advance halfway through animation (150ms)
      jest.advanceTimersByTime(150);
      
      // Check intermediate values (should be between start and end)
      expect(transformer.getZoom()).toBeGreaterThan(1);
      expect(transformer.getZoom()).toBeLessThan(2);
      expect(transformer.getCenter().x).toBeGreaterThan(500);
      expect(transformer.getCenter().x).toBeLessThan(600);
      expect(transformer.getCenter().y).toBeGreaterThan(400);
      expect(transformer.getCenter().y).toBeLessThan(500);
      
      // Verify tick events were fired
      expect(animationTickMock).toHaveBeenCalled();
      
      // Complete animation (+ extra time to ensure completion)
      jest.advanceTimersByTime(200);
      
      // Verify final values
      expect(transformer.getZoom()).toBeCloseTo(2, 1);
      expect(transformer.getCenter().x).toBeCloseTo(600, 0);
      expect(transformer.getCenter().y).toBeCloseTo(500, 0);
      
      // Verify animation end event
      expect(animationEndMock).toHaveBeenCalledTimes(1);
      expect(animationEndMock).toHaveBeenCalledWith(
        expect.objectContaining({
          zoom: expect.any(Number),
          center: expect.objectContaining({
            x: expect.any(Number),
            y: expect.any(Number)
          })
        })
      );
    });
    
    test('should cancel ongoing animation', () => {
      const animationEndMock = jest.fn();
      transformer.addEventListener(ViewportTransform.EVENTS.ANIMATION_END, animationEndMock);
      
      // Start animation
      transformer.animateTo({
        targetZoom: 2,
        targetCenterX: 600,
        targetCenterY: 500,
        durationMs: 300
      });
      
      // Advance halfway
      jest.advanceTimersByTime(150);
      
      // Cancel animation
      transformer.cancelAnimation();
      
      // Verify animation end event with canceled flag
      expect(animationEndMock).toHaveBeenCalledWith(
        expect.objectContaining({
          canceled: true
        })
      );
      
      // Verify values were not reset
      expect(transformer.getZoom()).toBeGreaterThan(1);
      expect(transformer.getZoom()).toBeLessThan(2);
      
      // Advance to what would have been the end
      jest.advanceTimersByTime(150);
      
      // Verify values didn't change further
      expect(transformer.getZoom()).toBeGreaterThan(1);
      expect(transformer.getZoom()).toBeLessThan(2);
    });
    
    test('should animate zoom only', () => {
      // Initial position
      const initialCenter = { x: 500, y: 400 };
      
      // Start animation with only zoom change
      transformer.animateZoom(2, 100);
      
      // Complete animation (+ extra time to ensure completion)
      jest.advanceTimersByTime(150);
      
      // Verify only zoom changed
      expect(transformer.getZoom()).toBeCloseTo(2, 1);
      expect(transformer.getCenter().x).toBeCloseTo(initialCenter.x, 0);
      expect(transformer.getCenter().y).toBeCloseTo(initialCenter.y, 0);
    });
    
    test('should animate center only', () => {
      // Initial zoom
      const initialZoom = 1;
      
      // Start animation with only center change
      transformer.animateCenter(600, 500, 100);
      
      // Complete animation (+ extra time to ensure completion)
      jest.advanceTimersByTime(150);
      
      // Verify only center changed
      expect(transformer.getZoom()).toBeCloseTo(initialZoom, 1);
      expect(transformer.getCenter().x).toBeCloseTo(600, 0);
      expect(transformer.getCenter().y).toBeCloseTo(500, 0);
    });
    
    test('should handle different easing functions', () => {
      // Test with linear easing
      transformer.reset();
      
      transformer.animateTo({
        targetZoom: 2,
        targetCenterX: 600, 
        targetCenterY: 500,
        durationMs: 100,
        easingFunction: 'linear'
      });
      
      jest.advanceTimersByTime(150);
      
      expect(transformer.getZoom()).toBeCloseTo(2, 1);
      
      // Test with easeInQuad
      transformer.reset();
      
      transformer.animateTo({
        targetZoom: 2,
        targetCenterX: 600,
        targetCenterY: 500,
        durationMs: 100,
        easingFunction: 'easeInQuad'
      });
      
      jest.advanceTimersByTime(150);
      
      expect(transformer.getZoom()).toBeCloseTo(2, 1);
      
      // Test with easeInOutQuad
      transformer.reset();
      
      transformer.animateTo({
        targetZoom: 2,
        targetCenterX: 600,
        targetCenterY: 500,
        durationMs: 100,
        easingFunction: 'easeInOutQuad'
      });
      
      jest.advanceTimersByTime(150);
      
      expect(transformer.getZoom()).toBeCloseTo(2, 1);
      
      // Test with unknown easing (should default to linear)
      transformer.reset();
      
      transformer.animateTo({
        targetZoom: 2,
        targetCenterX: 600,
        targetCenterY: 500,
        durationMs: 100,
        easingFunction: 'nonExistentEasing'
      });
      
      jest.advanceTimersByTime(150);
      
      expect(transformer.getZoom()).toBeCloseTo(2, 1);
    });
    
    test('should handle canceling when no animation is running', () => {
      // No animation running
      expect(transformer.animating).toBeFalsy();
      
      // Should not throw and return this for chaining
      const result = transformer.cancelAnimation();
      
      // Should still not be animating
      expect(transformer.animating).toBeFalsy();
      
      // Should return this for chaining
      expect(result).toBe(transformer);
    });
  });
});

describe('animation polyfills', () => {
  let originalWindow;
  let originalTimeout;
  let originalClearTimeout;
  
  beforeEach(() => {
    // Save original window object and timers
    originalWindow = global.window;
    originalTimeout = global.setTimeout;
    originalClearTimeout = global.clearTimeout;
    
    // Create a mock window if it doesn't exist
    if (typeof global.window === 'undefined') {
      global.window = {};
    }
  });
  
  afterEach(() => {
    // Restore original window object and timers
    global.window = originalWindow;
    global.setTimeout = originalTimeout;
    global.clearTimeout = originalClearTimeout;
  });
  
  test('should use setTimeout when window is undefined', () => {
    // Delete window object to simulate non-browser environment
    delete global.window;
    
    // Mock setTimeout and clearTimeout
    const mockSetTimeout = jest.fn((_callback, _ms) => 999);
    const mockClearTimeout = jest.fn();
    global.setTimeout = mockSetTimeout;
    global.clearTimeout = mockClearTimeout;
    
    const raf = getRequestAnimationFrame();
    const caf = getCancelAnimationFrame();
    
    // Verify raf is a function
    expect(typeof raf).toBe('function');
    
    // Verify caf is a function
    expect(typeof caf).toBe('function');
    
    // Test raf
    const callback = jest.fn();
    const timeoutId = raf(callback);
    
    // Verify setTimeout was called
    expect(mockSetTimeout).toHaveBeenCalledWith(callback, 16);
    
    // Test caf
    caf(timeoutId);
    
    // Verify clearTimeout was called
    expect(mockClearTimeout).toHaveBeenCalledWith(timeoutId);
  });
  
  test('should use window.requestAnimationFrame when available', () => {
    // Create fake window with requestAnimationFrame
    global.window = {
      requestAnimationFrame: jest.fn((_cb) => 123)
    };
    
    const raf = getRequestAnimationFrame();
    const callback = jest.fn();
    
    // Call raf
    raf(callback);
    
    // Verify window.requestAnimationFrame was called
    expect(window.requestAnimationFrame).toHaveBeenCalledWith(callback);
  });
  
  test('should use window.cancelAnimationFrame when available', () => {
    // Create fake window with cancelAnimationFrame
    global.window = {
      cancelAnimationFrame: jest.fn()
    };
    
    const caf = getCancelAnimationFrame();
    
    // Call caf
    caf(123);
    
    // Verify window.cancelAnimationFrame was called
    expect(window.cancelAnimationFrame).toHaveBeenCalledWith(123);
  });
  
  test('should fallback to webkitRequestAnimationFrame', () => {
    // Create fake window with vendor prefixed function
    global.window = {
      webkitRequestAnimationFrame: jest.fn((_cb) => 123)
    };
    
    const raf = getRequestAnimationFrame();
    const callback = jest.fn();
    
    // Call raf
    raf(callback);
    
    // Verify webkit prefixed function was called
    expect(window.webkitRequestAnimationFrame).toHaveBeenCalledWith(callback);
  });
  
  test('should fallback to mozRequestAnimationFrame', () => {
    // Create fake window with vendor prefixed function
    global.window = {
      mozRequestAnimationFrame: jest.fn((_cb) => 123)
    };
    
    const raf = getRequestAnimationFrame();
    const callback = jest.fn();
    
    // Call raf
    raf(callback);
    
    // Verify moz prefixed function was called
    expect(window.mozRequestAnimationFrame).toHaveBeenCalledWith(callback);
  });
  
  test('should fallback to webkitCancelAnimationFrame', () => {
    // Create fake window with vendor prefixed function
    global.window = {
      webkitCancelAnimationFrame: jest.fn()
    };
    
    const caf = getCancelAnimationFrame();
    
    // Call caf
    caf(123);
    
    // Verify webkit prefixed function was called
    expect(window.webkitCancelAnimationFrame).toHaveBeenCalledWith(123);
  });
  
  test('should fallback to mozCancelAnimationFrame', () => {
    // Create fake window with vendor prefixed function
    global.window = {
      mozCancelAnimationFrame: jest.fn()
    };
    
    const caf = getCancelAnimationFrame();
    
    // Call caf
    caf(123);
    
    // Verify moz prefixed function was called
    expect(window.mozCancelAnimationFrame).toHaveBeenCalledWith(123);
  });
  
  test('should fallback to setTimeout when no RAF is available', () => {
    // Create window without RAF
    global.window = {};
    
    // Mock setTimeout
    const mockSetTimeout = jest.fn((_callback, _ms) => 999);
    global.setTimeout = mockSetTimeout;
    
    const raf = getRequestAnimationFrame();
    const callback = jest.fn();
    
    // Call raf
    raf(callback);
    
    // Verify setTimeout was called
    expect(mockSetTimeout).toHaveBeenCalledWith(callback, 16);
  });
  
  test('should fallback to clearTimeout when no CAF is available', () => {
    // Create window without CAF
    global.window = {};
    
    // Mock clearTimeout
    const mockClearTimeout = jest.fn();
    global.clearTimeout = mockClearTimeout;
    
    const caf = getCancelAnimationFrame();
    
    // Call caf
    caf(123);
    
    // Verify clearTimeout was called
    expect(mockClearTimeout).toHaveBeenCalledWith(123);
  });
});