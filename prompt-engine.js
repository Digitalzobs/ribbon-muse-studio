function describeReferenceStrength(mode, label) {
  const map = {
    "strict reference": `Follow the uploaded ${label} references very closely.`,
    "soft reference": `Use the uploaded ${label} references as soft inspiration while keeping realism.`,
    "generated suggestion": `Use curated app-generated ${label} suggestions guided by the selected aesthetic.`,
    blended: `Blend uploaded ${label} references with app-generated styling suggestions in a polished way.`,
    strict: `Follow the uploaded ${label} references very closely.`,
    soft: `Use the uploaded ${label} references as soft inspiration.`,
  };
  return map[mode] || `Use a balanced ${label} interpretation with polished styling logic.`;
}

function paletteText(state) {
  const namedPalette = state.colorKeywords?.trim()
    ? `Color direction: ${state.colorKeywords.trim()}.`
    : "";
  return `${namedPalette} Primary color ${state.primaryColor}, secondary color ${state.secondaryColor}, accent color ${state.accentColor}. Palette mood: ${state.paletteMood}.`;
}

function brandText(state) {
  if (state.brand === "No brand") {
    return "No explicit brand placement. Keep the styling elevated and editorial without identifiable logos.";
  }
  const modeMap = {
    inspired: `The styling should be clearly inspired by ${state.brand} design language without turning it into costume.`,
    visible: `Use visible ${state.brand} styling details with logo visibility set to ${state.logoVisibility}.`,
    none: "Keep the styling brand-neutral.",
  };
  return `${modeMap[state.brandMode] || modeMap.inspired} Preferred logo placement: ${
    state.logoPlacement.length ? state.logoPlacement.join(", ") : "subtle accessories"
  }.`;
}

function environmentText(state) {
  const typed = state.environmentText?.trim();
  const preset = state.environmentPreset ? `Preset inspiration: ${state.environmentPreset}.` : "";
  const mode = {
    "strict image reference":
      "Follow uploaded environment imagery closely for architecture, lighting, and scene composition.",
    "typed description only":
      typed ? `Follow this written environment direction closely: ${typed}` : "Use a clean written environment direction.",
    "app suggestion": `Use the selected environment preset as the core scene direction. ${preset}`,
    blended: `${preset} ${typed ? `Blend the uploaded environment references with this note: ${typed}` : ""}`,
  };
  return mode[state.environmentMode] || `${preset} ${typed || "Use a luxurious, cohesive environment."}`;
}

function outputVariation(state, index) {
  if (state.outputType === "single") {
    return "Generate one polished hero image with premium realism.";
  }
  if (state.outputType === "carousel") {
    return `Image ${index + 1} of ${state.outputCount}: keep the same face, body, outfit, hair, and overall identity, while varying angle, expression, or micro-movement according to ${state.carouselStyle}.`;
  }
  return `Image ${index + 1} of ${state.outputCount}: create a connected themed scene-set image that feels part of a cohesive luxury narrative.`;
}

export function buildPrompt(state, index = 0) {
  const sections = [
    "Create a high-end, ultra-realistic editorial lifestyle image of the same female subject across the full set.",
    `Identity lock: ${state.keepSameFace ? "keep the same face" : "face may evolve subtly"}, ${
      state.keepSameBody ? "keep the same body proportions" : "body proportions may adapt slightly"
    }, identity consistency strength ${state.identityStrength}/100.`,
    state.faceImages.length
      ? `Face references available: ${state.faceImages.length}. Treat them as highest-priority identity anchors.`
      : "No face upload provided, so infer a cohesive influencer-style identity from the saved project context.",
    state.bodyImages.length
      ? `Body references available: ${state.bodyImages.length}. Respect body proportions and silhouette continuity.`
      : "No body upload provided, so keep the body polished, proportional, and fashion-editorial.",
    `${describeReferenceStrength(state.outfitMode, "outfit")} Outfit category direction: ${state.outfitCategory}.`,
    `${describeReferenceStrength(state.hairMode, "hair")} Hair should remain polished, flattering, and consistent with the brand energy.`,
    state.accessoryImages.length
      ? `Accessory references available: ${state.accessoryImages.length}. Integrate bags, shoes, jewelry, or sunglasses where visually coherent.`
      : "Accessories should feel intentionally styled rather than random.",
    brandText(state),
    paletteText(state),
    environmentText(state),
    `Pose and story direction: ${state.pose}, ${state.activity}, ${state.storyMode}. Expression: ${state.expression}. Framing: ${state.framing}. Motion and scene energy: ${state.motionDirection}.`,
    `Custom direction: ${state.customInstructions}.`,
    "Lighting should be flattering, glossy, luxury-forward, and highly detailed. Skin should look realistic. The final image should feel social-ready, editorial, and premium.",
    outputVariation(state, index),
  ];

  return sections.filter(Boolean).join(" ");
}

export function buildPromptSet(state) {
  return Array.from({ length: state.outputCount }, (_, index) => buildPrompt(state, index));
}
