# Xona AI Models - Detailed Specifications

## Image Generation Models

### creative-director

**Purpose**: AI-powered creative research and prompt refinement

**Capabilities**:
- Analyzes user intent from natural language prompts
- Researches trends from X (Twitter) and Google
- Transforms ideas into optimized generation plans
- Provides directional guidance for image generation

**Output**: Research findings and refined prompts (not direct images)

**Use Cases**:
- Exploring creative concepts before generating
- Getting inspiration and trend analysis
- Refining vague ideas into concrete prompts

**Parameters**:
- `idea` (required): The user's concept or idea
- `reference_images` (optional): Array of image URLs for style reference

**Price**: $0.03 USDC

---

### designer

**Purpose**: Image generation with intelligent style blending

**Capabilities**:
- Blends prompt with style keywords automatically
- Generates images with artistic control
- Supports multiple reference images
- Adjustable aspect ratios

**Output**: Generated image URL with metadata

**Use Cases**:
- Creating images in specific artistic styles
- Blending multiple style concepts
- Artistic control over output

**Parameters**:
- `prompt` (required): Detailed description
- `style` (optional): Array of style keywords (e.g., "cyberpunk", "watercolor")
- `aspect_ratio` (optional): Default 1:1
- `referenceImage` (optional): Array of reference image URLs

**Price**: $0.08 USDC

---

### nano-banana

**Purpose**: Fast, affordable direct image generation

**Capabilities**:
- Direct prompt-to-image generation
- No style blending overhead
- Fast generation times
- Supports reference images

**Output**: Generated image URL with metadata

**Use Cases**:
- Quick visualizations
- Prototyping and iteration
- Cost-effective batch generation

**Parameters**:
- `prompt` (required): Description of desired image
- `aspect_ratio` (optional): Default 1:1
- `referenceImage` (optional): Array of reference image URLs

**Price**: $0.10 USDC

---

### nano-banana-2

**Purpose**: Resolution-based flexible pricing

**Capabilities**:
- Dynamic pricing based on output resolution
- Cost-effective for lower resolutions
- High-quality output at all resolutions
- Supports reference images

**Output**: Generated image URL with resolution metadata

**Use Cases**:
- Thumbnails and previews (1k)
- Standard web graphics (2k)
- Print-quality images (4k)

**Parameters**:
- `prompt` (required): Description of desired image
- `resolution` (optional): "1k" ($0.06), "2k" ($0.10), "4k" ($0.15)
- `aspect_ratio` (optional): Default 1:1
- `referenceImage` (optional): Array of reference image URLs

**Price**: $0.06-$0.15 USDC (depending on resolution)

---

### nano-banana-pro

**Purpose**: Premium quality image generation

**Capabilities**:
- Highest quality outputs
- Advanced detail and coherence
- Professional-grade results
- Supports reference images

**Output**: Generated image URL with premium metadata

**Use Cases**:
- Professional projects
- Marketing materials
- High-fidelity visualizations
- Print and publication

**Parameters**:
- `prompt` (required): Detailed description
- `aspect_ratio` (optional): Default 1:1
- `referenceImage` (optional): Array of reference image URLs

**Price**: $0.20 USDC

---

### grok-imagine

**Purpose**: xAI Grok Imagine API integration

**Capabilities**:
- Powered by xAI's Grok model
- Single reference image support
- High-quality coherent outputs
- Advanced prompt understanding

**Output**: Generated image URL with Grok metadata

**Use Cases**:
- Grok-powered generation
- Image-to-image transformation
- Advanced prompt following

**Parameters**:
- `prompt` (required): Detailed description
- `referenceImage` (optional): Single image URL (only one supported)

**Price**: $0.04 USDC

---

### qwen-image

**Purpose**: Qwen model for balanced quality and price

**Capabilities**:
- High-quality image generation
- Cost-effective pricing
- Good prompt following
- Supports reference images

**Output**: Generated image URL with model metadata

**Use Cases**:
- Balanced quality/cost requirements
- General-purpose image generation
- Batch processing

**Parameters**:
- `prompt` (required): Detailed description
- `aspect_ratio` (optional): Default 1:1
- `referenceImage` (optional): Array of reference image URLs

**Price**: $0.05 USDC

---

### seedream-4.5

**Purpose**: ByteDance Seedream-4.5 advanced generation

**Capabilities**:
- Advanced AI features
- High-quality outputs
- Sophisticated prompt understanding
- Supports reference images

**Output**: Generated image URL with Seedream metadata

**Use Cases**:
- Advanced generation needs
- Complex scene composition
- Detailed requirements

**Parameters**:
- `prompt` (required): Detailed description
- `aspect_ratio` (optional): Default 1:1
- `referenceImage` (optional): Array of reference image URLs

**Price**: $0.08 USDC

---

## Video Generation Models

### short-generation

**Purpose**: 10-second video generation using Grok Video API

**Capabilities**:
- 10-second high-quality videos
- Text-to-video generation
- Image-to-video transformation
- xAI Grok Video model

**Output**: Generated video URL with metadata

**Use Cases**:
- Social media content
- Product showcases
- Animated concepts
- Visual storytelling

**Parameters**:
- `prompt` (required): Video description
- `aspect_ratio` (optional): Video aspect ratio
- `image_url` (optional): Source image for image-to-video

**Price**: $0.50 USDC

**Duration**: Fixed at 10 seconds

---

## Aspect Ratio Options

Common aspect ratios supported by most models:
- `1:1` - Square (default)
- `16:9` - Landscape
- `9:16` - Portrait
- `4:3` - Standard landscape
- `3:4` - Standard portrait
- `21:9` - Ultra-wide

---

## Style Keywords for Designer Model

Popular style keywords to suggest:
- **Art Styles**: cyberpunk, watercolor, oil painting, pixel art, anime, realism, impressionism
- **Lighting**: cinematic, neon, dramatic, soft, golden hour, studio
- **Mood**: mysterious, cheerful, dark, vibrant, peaceful, energetic
- **Era**: 1980s, Victorian, futuristic, medieval, art deco
- **Medium**: digital art, photography, illustration, 3D render, sketch
