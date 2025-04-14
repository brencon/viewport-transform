# viewport-transform

A lightweight, platform-agnostic utility for handling coordinate transformations between an original image and a viewport at different zoom levels and pan positions.

[![npm version](https://img.shields.io/npm/v/viewport-transform.svg)](https://www.npmjs.com/package/viewport-transform)
[![Build Status](https://travis-ci.org/brencon/viewport-transform.svg?branch=main)](https://travis-ci.org/brencon/viewport-transform)
[![Coverage Status](https://coveralls.io/repos/github/brencon/viewport-transform/badge.svg?branch=main)](https://coveralls.io/github/brencon/viewport-transform?branch=main)

## Installation

```bash
npm install viewport-transform
```

## Features

- Track the relationship between an original image and a displayed viewport
- Convert coordinates between image space and viewport space
- Calculate crop parameters based on the current viewport position
- Manage zoom and pan operations with boundary constraints
- Calculate the percentage of the original image visible in the viewport
- Platform agnostic - works in any JavaScript environment

## Usage

### Basic Example

```javascript
const { ViewportTransform } = require('viewport-transform');

// Initialize with image and viewport dimensions
const transformer = new ViewportTransform({
  imageWidth: 1000,  // Original image width
  imageHeight: 800,  // Original image height
  viewportWidth: 500, // Displayed viewport width
  viewportHeight: 400 // Displayed viewport height
});

// Set zoom level (e.g., from pinch gesture)
transformer.setZoom(2.5);

// Set center position (e.g., from pan gesture)
transformer.setCenter(600, 500);

// Get the visible area in original image coordinates
const visibleRect = transformer.getVisibleRect();
console.log(visibleRect);
// { x: 500, y: 420, width: 200, height: 160 }

// Convert viewport coordinates to image coordinates
const imagePoint = transformer.viewportToImage(250, 200);
console.log(imagePoint);
// { x: 600, y: 500 }

// Convert image coordinates to viewport coordinates
const viewportPoint = transformer.imageToViewport(700, 600);
console.log(viewportPoint);
// { x: 500, y: 450 }

// Get crop parameters for the current view
const cropParams = transformer.getCropParameters();
console.log(cropParams);
// { x: 500, y: 420, width: 200, height: 160 }

// Get percentage of image visible in viewport
const visiblePercentage = transformer.getVisiblePercentage();
console.log(visiblePercentage);
// 4% (because we're zoomed in to 2.5x)
```

### Integration with UI Frameworks

This library is framework-agnostic and can be integrated with any UI technology:

#### React Example

```javascript
import React, { useState } from 'react';
import { ViewportTransform } from 'viewport-transform';

function ImageEditor({ imageSrc, imageWidth, imageHeight }) {
  const [transformer] = useState(() => new ViewportTransform({
    imageWidth,
    imageHeight,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight
  }));
  
  // Handle zoom gesture
  const handlePinch = (scale) => {
    transformer.setZoom(scale);
    forceUpdate();
  };
  
  // Handle pan gesture
  const handlePan = (x, y) => {
    const imagePoint = transformer.viewportToImage(x, y);
    transformer.setCenter(imagePoint.x, imagePoint.y);
    forceUpdate();
  };
  
  // Get current crop parameters for display or processing
  const cropParams = transformer.getCropParameters();
  
  return (
    <div>
      {/* Implement UI using the transformer */}
    </div>
  );
}
```

#### React Native Example

```javascript
import React, { useRef } from 'react';
import { View, PanResponder, Image } from 'react-native';
import { ViewportTransform } from 'viewport-transform';

function ImageCropper({ imageUri, imageWidth, imageHeight }) {
  const transformer = useRef(new ViewportTransform({
    imageWidth,
    imageHeight,
    viewportWidth: screenWidth,
    viewportHeight: screenHeight
  })).current;
  
  // Implement pan and pinch gestures using PanResponder
  // ...
  
  // Use transformer to manage coordinates
  // ...
  
  return (
    <View>
      {/* UI implementation */}
    </View>
  );
}
```

## API Reference

### Constructor

```javascript
new ViewportTransform({
  imageWidth,    // Width of original image (pixels)
  imageHeight,   // Height of original image (pixels)
  viewportWidth, // Width of viewport (pixels)
  viewportHeight // Height of viewport (pixels)
})
```

### Methods

#### Zoom Operations

- `getZoom()` - Returns the current zoom level
- `setZoom(zoom)` - Sets the zoom level, clamped to min/max values

#### Pan Operations

- `getCenter()` - Returns the current center position as `{x, y}`
- `setCenter(x, y)` - Sets the center position, constrained to valid bounds

#### Coordinate Conversion

- `viewportToImage(viewportX, viewportY)` - Converts viewport coordinates to image coordinates
- `imageToViewport(imageX, imageY)` - Converts image coordinates to viewport coordinates

#### Viewport Information

- `getVisibleRect()` - Returns the visible rectangle in image coordinates as `{x, y, width, height}`
- `getVisiblePercentage()` - Returns the percentage of the original image visible in the viewport
- `getCropParameters()` - Returns crop parameters based on current viewport as `{x, y, width, height}`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
