/**
 * ViewportTransform
 * 
 * A utility for handling coordinate transformations between
 * an original image and a viewport (visible area) at different
 * zoom levels and pan positions.
 */
class ViewportTransform {
  /**
   * Default minimum zoom level
   * @type {number}
   */
  MIN_ZOOM = 0.1;
  
  /**
   * Default maximum zoom level
   * @type {number}
   */
  MAX_ZOOM = 10;
  
  /**
   * Event types for the ViewportTransform
   * @type {Object}
   */
  static EVENTS = {
    ZOOM_CHANGE: 'zoom-change',
    CENTER_CHANGE: 'center-change',
    RESET: 'reset',
    ANIMATION_START: 'animation-start',
    ANIMATION_TICK: 'animation-tick',
    ANIMATION_END: 'animation-end'
  };
  
  /**
   * @typedef {Object} Dimensions
   * @property {number} imageWidth - Width of the original image in pixels
   * @property {number} imageHeight - Height of the original image in pixels
   * @property {number} viewportWidth - Width of the viewport in pixels
   * @property {number} viewportHeight - Height of the viewport in pixels
   */
  
  /**
   * @typedef {Object} Point
   * @property {number} x - X coordinate
   * @property {number} y - Y coordinate
   */
  
  /**
   * @typedef {Object} Rectangle
   * @property {number} x - X coordinate of top-left corner
   * @property {number} y - Y coordinate of top-left corner
   * @property {number} width - Width of rectangle
   * @property {number} height - Height of rectangle
   */
  
  /**
   * Creates a new ViewportTransform instance
   * @param {Dimensions} dimensions - The dimensions of the image and viewport
   */
  constructor({
    imageWidth,
    imageHeight,
    viewportWidth,
    viewportHeight
  }) {
    // Store dimensions
    this.imageWidth = imageWidth;
    this.imageHeight = imageHeight;
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
    
    // Initialize with default values
    this.zoom = 1;
    
    // Center the viewport on the image by default
    this.centerX = imageWidth / 2;
    this.centerY = imageHeight / 2;
    
    // Initialize event listeners
    this.listeners = {};
    
    // Animation properties
    this.animating = false;
    this.animationId = null;
  }
  
  /**
   * Adds an event listener
   * @param {string} eventType - Type of event from EVENTS
   * @param {Function} callback - Function to call when event occurs
   * @returns {ViewportTransform} The current instance for chaining
   */
  addEventListener(eventType, callback) {
    if (!this.listeners[eventType]) {
      this.listeners[eventType] = [];
    }
    this.listeners[eventType].push(callback);
    return this;
  }
  
  /**
   * Removes an event listener
   * @param {string} eventType - Type of event from EVENTS
   * @param {Function} callback - Function to remove
   * @returns {ViewportTransform} The current instance for chaining
   */
  removeEventListener(eventType, callback) {
    if (this.listeners[eventType]) {
      this.listeners[eventType] = this.listeners[eventType]
        .filter(listener => listener !== callback);
    }
    return this;
  }
  
  /**
   * Emits an event to all registered listeners
   * @param {string} eventType - Type of event from EVENTS
   * @param {Object} data - Event data
   * @private
   */
  _emitEvent(eventType, data) {
    if (this.listeners[eventType]) {
      this.listeners[eventType].forEach(callback => {
        callback(data);
      });
    }
  }
  
  /**
   * Gets the current zoom level
   * @returns {number} The current zoom level
   */
  getZoom() {
    return this.zoom;
  }
  
  /**
   * Sets the zoom level, clamped to min/max values
   * @param {number} zoom - The new zoom level
   * @returns {ViewportTransform} The current instance for chaining
   */
  setZoom(zoom) {
    const oldZoom = this.zoom;
    this.zoom = Math.min(Math.max(zoom, this.MIN_ZOOM), this.MAX_ZOOM);
    
    if (oldZoom !== this.zoom) {
      this._emitEvent(ViewportTransform.EVENTS.ZOOM_CHANGE, {
        oldZoom,
        newZoom: this.zoom
      });
    }
    
    return this;
  }
  
  /**
   * Gets the current center position in image coordinates
   * @returns {Point} The center position
   */
  getCenter() {
    return {
      x: this.centerX,
      y: this.centerY
    };
  }
  
  /**
   * Sets the center position, constrained to ensure the viewport
   * stays within or overlapping the image bounds
   * @param {number} x - X coordinate in image space
   * @param {number} y - Y coordinate in image space
   * @returns {ViewportTransform} The current instance for chaining
   */
  setCenter(x, y) {
    const oldCenter = this.getCenter();
    
    // Calculate the actual visible area dimensions at current zoom
    const visibleWidth = this.viewportWidth / this.zoom;
    const visibleHeight = this.viewportHeight / this.zoom;
    
    // Calculate min and max allowed center positions
    // This ensures at least part of the image is always visible
    const minX = visibleWidth / 2;
    const maxX = this.imageWidth - (visibleWidth / 2);
    const minY = visibleHeight / 2;
    const maxY = this.imageHeight - (visibleHeight / 2);
    
    // Clamp the center position to valid range
    this.centerX = Math.min(Math.max(x, minX), maxX);
    this.centerY = Math.min(Math.max(y, minY), maxY);
    
    const newCenter = this.getCenter();
    if (oldCenter.x !== newCenter.x || oldCenter.y !== newCenter.y) {
      this._emitEvent(ViewportTransform.EVENTS.CENTER_CHANGE, {
        oldCenter,
        newCenter
      });
    }
    
    return this;
  }
  
  /**
   * Gets the rectangle representing the visible portion of the image
   * in original image coordinates
   * @returns {Rectangle} The visible rectangle
   */
  getVisibleRect() {
    const visibleWidth = this.viewportWidth / this.zoom;
    const visibleHeight = this.viewportHeight / this.zoom;
    
    return {
      x: this.centerX - (visibleWidth / 2),
      y: this.centerY - (visibleHeight / 2),
      width: visibleWidth,
      height: visibleHeight
    };
  }
  
  /**
   * Converts viewport coordinates to original image coordinates
   * @param {number} viewportX - X coordinate in viewport space
   * @param {number} viewportY - Y coordinate in viewport space
   * @returns {Point} The corresponding image coordinates
   */
  viewportToImage(viewportX, viewportY) {
    const visibleRect = this.getVisibleRect();
    
    return {
      x: visibleRect.x + (viewportX / this.zoom),
      y: visibleRect.y + (viewportY / this.zoom)
    };
  }
  
  /**
   * Converts original image coordinates to viewport coordinates
   * @param {number} imageX - X coordinate in image space
   * @param {number} imageY - Y coordinate in image space
   * @returns {Point} The corresponding viewport coordinates
   */
  imageToViewport(imageX, imageY) {
    const visibleRect = this.getVisibleRect();
    
    // Calculate the viewport coordinates
    let viewportX = (imageX - visibleRect.x) * this.zoom;
    let viewportY = (imageY - visibleRect.y) * this.zoom;
    
    // Clamp coordinates to viewport boundaries
    viewportX = Math.min(Math.max(viewportX, 0), this.viewportWidth);
    viewportY = Math.min(Math.max(viewportY, 0), this.viewportHeight);
    
    return {
      x: viewportX,
      y: viewportY
    };
  }
  
  /**
   * Gets crop parameters based on the current viewport position and zoom
   * @returns {Rectangle} The crop parameters in image coordinates
   */
  getCropParameters() {
    return this.getVisibleRect();
  }
  
  /**
   * Calculates the percentage of the original image visible in the viewport
   * @returns {number} The percentage (0-100) of the image that is visible
   */
  getVisiblePercentage() {
    const visibleRect = this.getVisibleRect();
    const visibleArea = visibleRect.width * visibleRect.height;
    const imageArea = this.imageWidth * this.imageHeight;
    
    // Calculate percentage, capped at 100%
    return Math.min((visibleArea / imageArea) * 100, 100);
  }

  /**
   * Zooms in by the specified factor
   * @param {number} [factor=1.2] - The factor to zoom in by
   * @returns {ViewportTransform} The current instance for chaining
   */
  zoomIn(factor = 1.2) {
    return this.setZoom(this.zoom * factor);
  }

  /**
   * Zooms out by the specified factor
   * @param {number} [factor=1.2] - The factor to zoom out by
   * @returns {ViewportTransform} The current instance for chaining
   */
  zoomOut(factor = 1.2) {
    return this.setZoom(this.zoom / factor);
  }

  /**
   * Resets the transformer to initial state (zoom=1, centered)
   * @returns {ViewportTransform} The current instance for chaining
   */
  reset() {
    const oldZoom = this.zoom;
    const oldCenter = this.getCenter();
    
    this.zoom = 1;
    this.centerX = this.imageWidth / 2;
    this.centerY = this.imageHeight / 2;
    
    const newCenter = this.getCenter();
    
    this._emitEvent(ViewportTransform.EVENTS.RESET, {
      oldZoom,
      newZoom: this.zoom,
      oldCenter,
      newCenter
    });
    
    return this;
  }

  /**
   * Animates to a new zoom level and center position
   * @param {Object} options - Animation options
   * @param {number} options.targetZoom - Target zoom level
   * @param {number} options.targetCenterX - Target center X position
   * @param {number} options.targetCenterY - Target center Y position
   * @param {number} [options.durationMs=300] - Animation duration in milliseconds
   * @param {string} [options.easingFunction='easeOutQuad'] - Easing function name
   * @returns {ViewportTransform} The current instance for chaining
   */
  animateTo({
    targetZoom,
    targetCenterX,
    targetCenterY,
    durationMs = 300,
    easingFunction = 'easeOutQuad'
  }) {
    // Cancel any ongoing animation
    this.cancelAnimation();
    
    // Ensure targets are within valid ranges
    targetZoom = Math.min(Math.max(targetZoom, this.MIN_ZOOM), this.MAX_ZOOM);
    
    // Store start values and calculate distances
    const startTime = Date.now();
    const endTime = startTime + durationMs;
    const startZoom = this.zoom;
    const startCenterX = this.centerX;
    const startCenterY = this.centerY;
    const zoomDiff = targetZoom - startZoom;
    const centerXDiff = targetCenterX - startCenterX;
    const centerYDiff = targetCenterY - startCenterY;
    
    // Set animating flag
    this.animating = true;
    
    // Emit animation start event
    this._emitEvent(ViewportTransform.EVENTS.ANIMATION_START, {
      startZoom,
      targetZoom,
      startCenter: { x: startCenterX, y: startCenterY },
      targetCenter: { x: targetCenterX, y: targetCenterY },
      durationMs
    });
    
    // Define animation step function
    const step = () => {
      const now = Date.now();
      
      // If animation is complete
      if (now >= endTime) {
        // Set final values
        this.setZoom(targetZoom);
        this.setCenter(targetCenterX, targetCenterY);
        
        // Clear animation state
        this.animating = false;
        this.animationId = null;
        
        // Emit animation end event
        this._emitEvent(ViewportTransform.EVENTS.ANIMATION_END, {
          zoom: this.zoom,
          center: this.getCenter()
        });
        
        return;
      }
      
      // Calculate progress (0 to 1)
      const progress = (now - startTime) / durationMs;
      const easedProgress = this._getEasingValue(easingFunction, progress);
      
      // Calculate interpolated values
      const newZoom = startZoom + (zoomDiff * easedProgress);
      const newCenterX = startCenterX + (centerXDiff * easedProgress);
      const newCenterY = startCenterY + (centerYDiff * easedProgress);
      
      // Update values
      this.setZoom(newZoom);
      this.setCenter(newCenterX, newCenterY);
      
      // Emit animation tick event
      this._emitEvent(ViewportTransform.EVENTS.ANIMATION_TICK, {
        progress,
        zoom: this.zoom,
        center: this.getCenter()
      });
      
      // Schedule next step
      this.animationId = requestAnimationFrame(step);
    };
    
    // Start animation
    this.animationId = requestAnimationFrame(step);
    
    return this;
  }
  
  /**
   * Cancels any ongoing animation
   * @returns {ViewportTransform} The current instance for chaining
   */
  cancelAnimation() {
    if (this.animating && this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animating = false;
      this.animationId = null;
      
      this._emitEvent(ViewportTransform.EVENTS.ANIMATION_END, {
        zoom: this.zoom,
        center: this.getCenter(),
        canceled: true
      });
    }
    return this;
  }
  
  /**
   * Gets an eased value based on the easing function name
   * @param {string} name - Name of the easing function
   * @param {number} t - Progress value (0 to 1)
   * @returns {number} Eased value
   * @private
   */
  _getEasingValue(name, t) {
    switch (name) {
      case 'linear':
        return t;
      case 'easeInQuad':
        return t * t;
      case 'easeOutQuad':
        return t * (2 - t);
      case 'easeInOutQuad':
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      default:
        return t;
    }
  }
  
  /**
   * Animates a zoom operation to the target zoom centered on the current center
   * @param {number} targetZoom - The target zoom level
   * @param {number} [durationMs=300] - Animation duration in milliseconds
   * @returns {ViewportTransform} The current instance for chaining
   */
  animateZoom(targetZoom, durationMs = 300) {
    return this.animateTo({
      targetZoom,
      targetCenterX: this.centerX,
      targetCenterY: this.centerY,
      durationMs
    });
  }
  
  /**
   * Animates a pan operation to the target center at the current zoom level
   * @param {number} targetCenterX - Target center X coordinate
   * @param {number} targetCenterY - Target center Y coordinate
   * @param {number} [durationMs=300] - Animation duration in milliseconds
   * @returns {ViewportTransform} The current instance for chaining
   */
  animateCenter(targetCenterX, targetCenterY, durationMs = 300) {
    return this.animateTo({
      targetZoom: this.zoom,
      targetCenterX,
      targetCenterY,
      durationMs
    });
  }
}

// Export the polyfill functions for testability
const getRequestAnimationFrame = () => {
  if (typeof window !== 'undefined') {
    return window.requestAnimationFrame || 
      window.webkitRequestAnimationFrame || 
      window.mozRequestAnimationFrame ||
      (callback => setTimeout(callback, 16));
  }
  return callback => setTimeout(callback, 16);
};

const getCancelAnimationFrame = () => {
  if (typeof window !== 'undefined') {
    return window.cancelAnimationFrame || 
      window.webkitCancelAnimationFrame || 
      window.mozCancelAnimationFrame ||
      clearTimeout;
  }
  return clearTimeout;
};

// Use the functions
const requestAnimationFrame = getRequestAnimationFrame();
const cancelAnimationFrame = getCancelAnimationFrame();

module.exports = {
  ViewportTransform,
  // Export for testing purposes
  getRequestAnimationFrame,
  getCancelAnimationFrame
};