# Video Generation Examples

## Example 1: Text-to-Video Generation

**User Request**: "Generate a video of a drone flying over mountains"

**Workflow**:
1. Determine type: Video generation
2. Present model: short-generation ($0.50)
3. Collect prompt: "Drone footage flying over majestic mountains at sunrise"
4. Show pricing: $0.50 USDC for 10-second video
5. User confirms
6. Call API: `POST https://api.xona-agent.com/base/video/short-generation` with body:
   ```json
   {"prompt": "Drone footage flying over majestic mountains at sunrise"}
   ```
7. Return video URL

---

## Example 2: Image-to-Video Transformation

**User Request**: "Turn this image into a video"

**Workflow**:
1. Determine type: Video generation from image
2. Present model: short-generation ($0.50)
3. Collect parameters:
   - Prompt: "Animate this scene with gentle camera movement"
   - Image URL: [user-provided static image]
4. Show pricing: $0.50 USDC for 10-second video
5. User confirms
6. Call API: `POST https://api.xona-agent.com/base/video/short-generation` with body:
   ```json
   {
     "prompt": "Animate this scene with gentle camera movement",
     "image_url": "https://example.com/source-image.jpg"
   }
   ```
7. Return video URL

---

## Example 3: Vertical Video for Social Media

**User Request**: "Create a vertical video for TikTok"

**Workflow**:
1. Determine type: Video generation
2. Present model: short-generation ($0.50)
3. Collect parameters:
   - Prompt: "Ocean waves crashing on a tropical beach"
   - Aspect ratio: "9:16" (vertical/TikTok format)
4. Show pricing: $0.50 USDC for 10-second video
5. User confirms
6. Call API: `POST https://api.xona-agent.com/base/video/short-generation` with body:
   ```json
   {
     "prompt": "Ocean waves crashing on a tropical beach",
     "aspect_ratio": "9:16"
   }
   ```
7. Return video URL

---

## Example 4: Cinematic Video

**User Request**: "Generate a cinematic video"

**Workflow**:
1. Determine type: Video generation
2. Present model: short-generation ($0.50)
3. Collect parameters:
   - Prompt: "Cinematic drone shot through foggy forest with dappled sunlight"
   - Aspect ratio: "21:9" (ultra-wide cinematic)
4. Show pricing: $0.50 USDC for 10-second video
5. User confirms
6. Call API: `POST https://api.xona-agent.com/base/video/short-generation` with body:
   ```json
   {
     "prompt": "Cinematic drone shot through foggy forest with dappled sunlight",
     "aspect_ratio": "21:9"
   }
   ```
7. Return video URL

---

## Example 5: Product Showcase

**User Request**: "Create a video showcasing this product"

**Workflow**:
1. Determine type: Video generation from product image
2. Present model: short-generation ($0.50)
3. Collect parameters:
   - Prompt: "Elegant 360-degree rotation of the product with lighting effects"
   - Image URL: [product image URL]
   - Aspect ratio: "1:1" (square for social media)
4. Show pricing: $0.50 USDC for 10-second video
5. User confirms
6. Call API: `POST https://api.xona-agent.com/base/video/short-generation` with body:
   ```json
   {
     "prompt": "Elegant 360-degree rotation of the product with lighting effects",
     "image_url": "https://example.com/product-image.jpg",
     "aspect_ratio": "1:1"
   }
   ```
7. Return video URL

---

## Video Generation Dialog Examples

### Initial Video Request

**User**: "Generate a video of a futuristic city"

**Assistant**: I can generate a 10-second AI video using Grok Video API.

**Pricing**: $0.50 USDC on SKALE Base network

**Please provide**:
1. **Prompt** (required): Describe the video
2. **Aspect ratio** (optional): 1:1 (default), 16:9, 9:16, 21:9
3. **Source image** (optional): URL for image-to-video conversion

**User**:
- Prompt: "Futuristic city with flying cars and neon lights at night"
- Aspect ratio: 16:9

**Assistant**: This will cost **$0.50 USDC** for a 10-second video.

Proceed with generation? (yes/no)

---

### Image-to-Video Conversion

**User**: "Turn this image into a video"

**Assistant**: I can transform your image into a 10-second AI video.

**Pricing**: $0.50 USDC on SKALE Base network

**Please provide**:
1. **Image URL** (required): The source image
2. **Prompt** (required): How should the image be animated?
3. **Aspect ratio** (optional): Default matches source image

**User**:
- Image URL: https://example.com/image.jpg
- Prompt: "Gentle zoom in with parallax effect on the mountains"
- Aspect ratio: 16:9

**Assistant**: This will cost **$0.50 USDC** for a 10-second video.

Proceed with generation? (yes/no)

---

### Video Style Recommendations

**User**: "What kind of videos can I generate?"

**Assistant**: Here are popular video generation styles:

**Camera Movements**:
- Drone flyover: "Drone footage flying over [landscape]"
- Zoom effect: "Slow zoom into [subject]"
- Pan shot: "Pan across [scene]"
- 360° rotation: "360-degree rotation of [object]"

**Visual Styles**:
- Cinematic: "Cinematic shot of [scene] with dramatic lighting"
- Aerial: "Aerial view of [location] at [time of day]"
- Product showcase: "Product video with lighting effects"
- Nature: "Time-lapse of [natural phenomenon]"

**Atmospheric**:
- Foggy: "[Scene] through mist with ethereal lighting"
- Sunny: "[Scene] bathed in golden sunlight"
- Night: "[Scene] at night with neon lights"
- Rainy: "[Scene] in the rain with reflections"

**Recommended aspect ratios**:
- **1:1**: Square (Instagram, general use)
- **16:9**: Landscape (YouTube, standard video)
- **9:16**: Portrait (TikTok, Reels, Shorts)
- **21:9**: Ultra-wide (cinematic)

---

## Video Output Format

**Generated videos**:
- **Duration**: Always 10 seconds
- **Format**: MP4 (via CDN URL)
- **Quality**: High definition
- **Audio**: Not included (video only)

**URL format**: Generated videos are delivered as CDN URLs for direct download or embedding.

---

## Common Video Use Cases

### Social Media
- TikTok: 9:16 aspect ratio
- Instagram Reels: 9:16 aspect ratio
- YouTube Shorts: 9:16 aspect ratio
- Instagram Feed: 1:1 aspect ratio

### Professional
- Product showcases: 1:1 or 16:9
- Website headers: 21:9 or 16:9
- Presentations: 16:9
- Cinematic previews: 21:9

### Creative
- Artistic visualizations: Any ratio
- Concept animations: Any ratio
- Storyboards: 16:9

---

## Error Handling Examples

### Invalid Image URL

**User**: "Turn this image into a video: http://invalid-url.com/image.jpg"

**Assistant**: The image URL appears to be invalid. Please ensure:
- URL uses HTTPS
- Image is publicly accessible
- Image format is JPG or PNG

---

### Payment Error

**User**: [Confirms generation but has insufficient balance]

**Assistant**: Payment failed: Insufficient USDC balance on SKALE Base

**Required**: $0.50 USDC
**Current**: $0.00 USDC

To fund your wallet, bridge USDC from Ethereum mainnet to SKALE Base.

---

### Timeout Error

**User**: [Request times out]

**Assistant**: Generation timed out. This can happen with complex prompts.

Suggestions:
1. Try a simpler prompt
2. Reduce detail in description
3. Focus on main subject only

Would you like to try with a revised prompt?
