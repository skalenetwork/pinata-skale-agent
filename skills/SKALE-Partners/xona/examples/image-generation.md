# Image Generation Examples

## Example 1: Simple Image Generation

**User Request**: "Generate an image of a futuristic city at sunset"

**Workflow**:
1. Determine type: Image generation
2. Present model options with pricing
3. User selects: nano-banana ($0.10)
4. Collect prompt: "A futuristic city at sunset with flying cars and tall glass buildings"
5. Show pricing: $0.10 USDC on SKALE Base
6. User confirms
7. Call API: `POST https://api.xona-agent.com/base/image/nano-banana` with body:
   ```json
   {"prompt": "A futuristic city at sunset with flying cars and tall glass buildings"}
   ```
8. Return image URL

---

## Example 2: Styled Image Generation

**User Request**: "Create a cyberpunk portrait"

**Workflow**:
1. Determine type: Image generation
2. Present model options
3. User selects: designer ($0.08) for style blending
4. Collect parameters:
   - Prompt: "Portrait of a person"
   - Style: ["cyberpunk", "neon", "futuristic"]
   - Aspect ratio: "1:1"
5. Show pricing: $0.08 USDC
6. User confirms
7. Call API: `POST https://api.xona-agent.com/base/image/designer` with body:
   ```json
   {
     "prompt": "Portrait of a person",
     "style": ["cyberpunk", "neon", "futuristic"],
     "aspect_ratio": "1:1"
   }
   ```
8. Return image URL

---

## Example 3: High-Quality Professional Image

**User Request**: "I need a high-quality image for my marketing"

**Workflow**:
1. Determine type: Image generation
2. Present model options
3. User selects: nano-banana-pro ($0.20) for highest quality
4. Collect prompt: "Professional product photography of a smartwatch on a minimal white background"
5. Show pricing: $0.20 USDC
6. User confirms
7. Call API: `POST https://api.xona-agent.com/base/image/nano-banana-pro` with body:
   ```json
   {"prompt": "Professional product photography of a smartwatch on a minimal white background"}
   ```
8. Return image URL

---

## Example 4: Resolution-Specific Generation

**User Request**: "Generate a 4k wallpaper"

**Workflow**:
1. Determine type: Image generation
2. Present model options
3. User selects: nano-banana-2 ($0.15 for 4k)
4. Collect parameters:
   - Prompt: "Mountain landscape at sunrise"
   - Resolution: "4k"
   - Aspect ratio: "16:9"
5. Show pricing: $0.15 USDC
6. User confirms
7. Call API: `POST https://api.xona-agent.com/base/image/nano-banana-2` with body:
   ```json
   {
     "prompt": "Mountain landscape at sunrise",
     "resolution": "4k",
     "aspect_ratio": "16:9"
   }
   ```
8. Return image URL

---

## Example 5: Image-to-Image Generation

**User Request**: "Transform this image into a cyberpunk style"

**Workflow**:
1. Determine type: Image generation with reference
2. Present model options
3. User selects: grok-imagine ($0.04)
4. Collect parameters:
   - Prompt: "Transform into cyberpunk style"
   - Reference image: [user-provided URL]
5. Show pricing: $0.04 USDC
6. User confirms
7. Call API: `POST https://api.xona-agent.com/base/image/grok-imagine` with body:
   ```json
   {
     "prompt": "Transform into cyberpunk style",
     "referenceImage": "https://example.com/reference-image.jpg"
   }
   ```
8. Return image URL

---

## Example 6: Creative Research Before Generation

**User Request**: "I have an idea for an image but need help refining it"

**Workflow**:
1. Determine type: Image generation concept
2. Recommend: creative-director for research
3. Collect idea: "A serene garden with magical elements"
4. Show pricing: $0.03 USDC
5. User confirms
6. Call API: `POST https://api.xona-agent.com/base/image/creative-director` with body:
   ```json
   {"idea": "A serene garden with magical elements"}
   ```
7. Return research and refined prompt
8. Offer to generate image using refined prompt

---

## Example 7: Cost-Effective Batch Generation

**User Request**: "Generate 5 quick variations of this concept"

**Workflow**:
1. Determine type: Multiple image generations
2. Recommend: nano-banana ($0.10) for cost efficiency
3. Explain total cost: 5 × $0.10 = $0.50 USDC
4. Collect base prompt: "Abstract geometric patterns in blue"
5. Show total pricing: $0.50 USDC
6. User confirms
7. Call API: `POST https://api.xona-agent.com/base/image/nano-banana` 5 times with variations:
   ```json
   {"prompt": "Abstract geometric patterns in blue - variation 1"}
   {"prompt": "Abstract geometric patterns in blue - variation 2"}
   ...
   ```
8. Return all 5 image URLs

---

## Example 8: Multi-Style Blend

**User Request**: "Create an image that's part watercolor and part cyberpunk"

**Workflow**:
1. Determine type: Image generation with style blending
2. Recommend: designer ($0.08) for style blending
3. Collect parameters:
   - Prompt: "A cityscape transitioning from nature to technology"
   - Style: ["watercolor", "cyberpunk", "fusion"]
   - Aspect ratio: "16:9"
4. Show pricing: $0.08 USDC
5. User confirms
6. Call API: `POST https://api.xona-agent.com/base/image/designer` with body:
   ```json
   {
     "prompt": "A cityscape transitioning from nature to technology",
     "style": ["watercolor", "cyberpunk", "fusion"],
     "aspect_ratio": "16:9"
   }
   ```
7. Return image URL

---

## Dialog Examples

### Model Selection Dialog

**Assistant**: Which image generation model would you like to use?

| Model | Price | Description | Best For |
|-------|-------|-------------|----------|
| creative-director | $0.03 | Research and prompt refinement | Exploring ideas |
| designer | $0.08 | Style blending | Artistic control |
| nano-banana | $0.10 | Fast generation | Quick results |
| nano-banana-2 | $0.06-$0.15 | Resolution-based | Specific sizes |
| nano-banana-pro | $0.20 | Premium quality | Professional use |
| grok-imagine | $0.04 | Grok AI model | Grok-powered |
| qwen-image | $0.05 | Balanced | Cost/quality balance |
| seedream-4.5 | $0.08 | Advanced features | Complex scenes |

**User**: I'll use designer for $0.08

---

### Pricing Confirmation Dialog

**Assistant**: This will cost **$0.08 USDC** on SKALE Base network.

The image will be generated using the designer model with style blending.

Proceed with generation? (yes/no)

**User**: yes

**Assistant**: Generating your image... [Image URL returned]

---

### Parameter Collection Dialog

**Assistant**: Please provide the following for your image:

1. **Prompt** (required): Describe the image you want
   Example: "A serene Japanese garden with cherry blossoms"

2. **Style keywords** (optional): List styles to blend
   Examples: watercolor, impressionist, minimalist

3. **Aspect ratio** (optional): Default is 1:1
   Options: 1:1, 16:9, 9:16, 4:3, 3:4, 21:9

4. **Reference images** (optional): Provide image URLs for style reference

**User**:
- Prompt: "A cozy coffee shop interior"
- Style: warm, minimalist, photography
- Aspect ratio: 16:9

**Assistant**: Perfect! This will cost **$0.08 USDC**. Proceed? (yes/no)
