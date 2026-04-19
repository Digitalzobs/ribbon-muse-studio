export const NAV_ITEMS = [
  { id: "create", label: "Create" },
  { id: "library", label: "Library" },
  { id: "prompts", label: "Prompts" },
  { id: "looks", label: "Saved Looks" },
  { id: "account", label: "Account" },
];

export const OUTFIT_CATEGORIES = [
  "Jeans + top",
  "Dress",
  "Skirt set",
  "Two-piece set",
  "Tracksuit",
  "Track pants look",
  "Cute casual look",
  "Sporty look",
  "Luxury look",
  "Clean girl look",
  "Baddie look",
  "Airport look",
  "Beachwear",
  "Loungewear",
  "Office chic",
  "Dinner look",
  "Gym fit",
  "Streetwear",
];

export const BRANDS = [
  "No brand",
  "Chanel",
  "Dior",
  "Louis Vuitton",
  "Nike",
  "Adidas",
  "Zara",
  "Skims",
  "YSL",
  "Gucci",
];

export const ENVIRONMENT_PRESETS = [
  "Luxury hotel balcony",
  "Beach resort",
  "Airport",
  "Cafe",
  "City street",
  "Private jet",
  "Home kitchen",
  "Poolside",
  "Restaurant",
  "Fashion studio",
  "Mall",
  "Upscale bedroom",
  "Elevator",
  "Villa exterior",
];

export const POSES = [
  "Standing",
  "Sitting",
  "Walking",
  "Leaning",
  "Over-the-shoulder",
  "Mirror pose",
  "Close-up portrait",
  "Full-body pose",
  "Side pose",
  "Relaxed candid pose",
];

export const ACTIVITIES = [
  "Holding coffee",
  "Fixing hair",
  "Using phone",
  "Stepping out of a car",
  "Shopping",
  "Cooking",
  "Entering hotel",
  "Poolside lounging",
  "Getting out of elevator",
  "Carrying bags",
  "Applying lip gloss",
  "Airport walking",
];

export const STORY_MODES = [
  "Pretty influencer pose",
  "Lifestyle moment",
  "Soft candid",
  "Editorial fashion shot",
  "Action shot",
  "Mini story sequence",
];

export const EXPRESSIONS = [
  "Soft smile",
  "Neutral",
  "Confident",
  "Playful",
  "Serious editorial",
  "Relaxed",
];

export const FRAMING_OPTIONS = [
  "Close-up",
  "Half body",
  "Three-quarter",
  "Full body",
  "Wide shot",
];

export const OUTPUT_TYPES = [
  { id: "single", label: "Single image" },
  { id: "carousel", label: "Carousel" },
  { id: "scene-set", label: "Scene set" },
];

export const CAROUSEL_COUNTS = [3, 5, 7];

export const CAROUSEL_STYLES = [
  "Same exact scene",
  "Same location, different angles",
  "Editorial pose set",
  "Mini story sequence",
];

export const FILE_GROUPS = [
  { key: "faceImages", label: "Face references", limit: 3 },
  { key: "bodyImages", label: "Body references", limit: 3 },
  { key: "outfitImages", label: "Outfit references", limit: 6 },
  { key: "hairImages", label: "Hair references", limit: 6 },
  { key: "accessoryImages", label: "Accessory references", limit: 6 },
  { key: "environmentImages", label: "Environment references", limit: 4 },
];

export const DEFAULT_CREATE_STATE = {
  projectTitle: "Untitled Muse Project",
  faceImages: [],
  bodyImages: [],
  outfitImages: [],
  hairImages: [],
  accessoryImages: [],
  environmentImages: [],
  keepSameFace: true,
  keepSameBody: true,
  identityStrength: 88,
  outfitSource: "blend",
  hairSource: "blend",
  outfitMode: "blended",
  hairMode: "blended",
  environmentMode: "blended",
  outfitCategory: "Luxury look",
  brand: "No brand",
  brandMode: "inspired",
  logoVisibility: "subtle",
  logoPlacement: ["bag", "accessories"],
  primaryColor: "#ff2f92",
  secondaryColor: "#ffffff",
  accentColor: "#ffc5de",
  paletteMood: "Hot pink, pearl white, and blush highlights",
  colorKeywords: "pink, white, blush",
  environmentSource: "typed",
  environmentPreset: "Luxury hotel balcony",
  environmentText: "Sunny luxury hotel balcony with soft city glow and editorial travel energy.",
  pose: "Standing",
  activity: "Holding coffee",
  storyMode: "Editorial fashion shot",
  expression: "Confident",
  framing: "Three-quarter",
  motionDirection: "Subtle movement with luxury lifestyle energy",
  customInstructions:
    "Keep the result realistic, polished, luxe, feminine, and editorial with clean lighting.",
  outputType: "carousel",
  outputCount: 5,
  carouselStyle: "Same location, different angles",
};
