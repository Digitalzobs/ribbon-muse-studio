import {
  NAV_ITEMS,
  OUTFIT_CATEGORIES,
  BRANDS,
  ENVIRONMENT_PRESETS,
  POSES,
  ACTIVITIES,
  STORY_MODES,
  EXPRESSIONS,
  FRAMING_OPTIONS,
  OUTPUT_TYPES,
  CAROUSEL_COUNTS,
  CAROUSEL_STYLES,
  FILE_GROUPS,
  DEFAULT_CREATE_STATE,
} from "./constants.js";
import {
  getAll,
  getOne,
  putOne,
  queryByUser,
  getSessionUserId,
  setSessionUserId,
} from "./storage.js";
import { buildPrompt, buildPromptSet } from "./prompt-engine.js";
import { buildMockImage } from "./mock-generator.js";

const app = document.querySelector("#app");

const state = {
  currentUser: null,
  activeView: "create",
  authMode: "login",
  createForm: structuredClone(DEFAULT_CREATE_STATE),
  library: [],
  looks: [],
  prompts: [],
  selectedProjectId: null,
  generationResult: null,
  promptSearch: "",
  notice: "",
};

function uid(prefix) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function nowIso() {
  return new Date().toISOString();
}

function formatDate(value) {
  return new Date(value).toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function escapeHtml(value = "") {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function setNotice(message) {
  state.notice = message;
  render();
  if (message) {
    window.clearTimeout(setNotice.timer);
    setNotice.timer = window.setTimeout(() => {
      state.notice = "";
      render();
    }, 2600);
  }
}

function pickPalette(form) {
  return [form.primaryColor, form.secondaryColor, form.accentColor];
}

async function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function loadCurrentUser() {
  const userId = getSessionUserId();
  if (!userId) return null;
  return getOne("users", userId);
}

async function refreshUserData() {
  if (!state.currentUser) return;
  const [library, looks, prompts] = await Promise.all([
    queryByUser("projects", state.currentUser.id),
    queryByUser("looks", state.currentUser.id),
    queryByUser("prompts", state.currentUser.id),
  ]);
  state.library = library;
  state.looks = looks;
  state.prompts = prompts;
}

function selectedOutputCount(form) {
  return form.outputType === "single" ? 1 : Number(form.outputCount || 3);
}

function syncDerivedFields() {
  state.createForm.outputCount = selectedOutputCount(state.createForm);
}

function formFromProject(project) {
  return {
    ...structuredClone(DEFAULT_CREATE_STATE),
    ...project.settings,
    ...project.references,
    projectTitle: project.title,
  };
}

function saveDraftLocally() {
  window.localStorage.setItem("ribbon-draft", JSON.stringify(state.createForm));
}

function restoreDraftLocally() {
  const draft = window.localStorage.getItem("ribbon-draft");
  if (!draft) return;
  try {
    state.createForm = { ...structuredClone(DEFAULT_CREATE_STATE), ...JSON.parse(draft) };
  } catch {
    state.createForm = structuredClone(DEFAULT_CREATE_STATE);
  }
}

async function handleAuthSubmit(formData) {
  const allUsers = await getAll("users");
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "").trim();
  const name = String(formData.get("name") || "").trim();

  if (!email) {
    setNotice("Email is required.");
    return;
  }

  if (state.authMode === "signup") {
    if (!password || password.length < 4) {
      setNotice("Use a password with at least 4 characters for this local prototype.");
      return;
    }
    if (allUsers.some((user) => user.email === email)) {
      setNotice("That email already has an account.");
      return;
    }
    const user = {
      id: uid("user"),
      email,
      password,
      name: name || email.split("@")[0],
      createdAt: nowIso(),
    };
    await putOne("users", user);
    state.currentUser = user;
    setSessionUserId(user.id);
    await refreshUserData();
    setNotice("Account created and saved locally.");
    return;
  }

  if (state.authMode === "forgot") {
    const user = allUsers.find((item) => item.email === email);
    if (!user) {
      setNotice("We couldn't find that account.");
      return;
    }
    user.password = password || "reset1234";
    await putOne("users", user);
    setNotice("Password reset saved locally. You can log in now.");
    state.authMode = "login";
    render();
    return;
  }

  const user = allUsers.find((item) => item.email === email && item.password === password);
  if (!user) {
    setNotice("Incorrect email or password.");
    return;
  }
  state.currentUser = user;
  setSessionUserId(user.id);
  await refreshUserData();
  setNotice("Welcome back.");
}

function renderAuth() {
  const isLogin = state.authMode === "login";
  const isSignup = state.authMode === "signup";
  const buttonLabel = isSignup ? "Create account" : isLogin ? "Log in" : "Reset password";

  return `
    <main class="auth-shell">
      <section class="auth-hero">
        <div class="ribbon-badge">Premium AI styling studio</div>
        <h1>Ribbon Muse Studio</h1>
        <p>
          Build identity-consistent, fashion-forward AI visuals with one refined workflow for references,
          styling, environments, carousels, and prompt vaults.
        </p>
        <div class="hero-points">
          <div class="hero-point">
            <strong>Identity locks</strong>
            <span>Face and body consistency across every set.</span>
          </div>
          <div class="hero-point">
            <strong>Brand-aware styling</strong>
            <span>Luxury, sportswear, and high-street logic with controlled logo placement.</span>
          </div>
          <div class="hero-point">
            <strong>Prompt vaults</strong>
            <span>Every generated output stores a reusable detailed prompt beneath the visual result.</span>
          </div>
        </div>
      </section>
      <section class="auth-card ribbon-corners">
        <div class="card-topline">Local prototype auth</div>
        <h2>${isSignup ? "Create your studio account" : isLogin ? "Log back in" : "Reset your password"}</h2>
        <p class="muted">
          This build persists accounts, prompts, looks, and generations locally in your browser for a fast prototype workflow.
        </p>
        <form id="auth-form" class="stack-lg">
          ${
            isSignup
              ? `<label class="field">
                  <span>Name</span>
                  <input type="text" name="name" placeholder="Your display name" />
                </label>`
              : ""
          }
          <label class="field">
            <span>Email</span>
            <input type="email" name="email" placeholder="you@example.com" required />
          </label>
          <label class="field">
            <span>${state.authMode === "forgot" ? "New password" : "Password"}</span>
            <input type="password" name="password" placeholder="${state.authMode === "forgot" ? "Optional. Defaults to reset1234" : "Enter your password"}" ${isLogin || isSignup ? "required" : ""} />
          </label>
          <button class="primary-button" type="submit">${buttonLabel}</button>
        </form>
        <div class="switch-row">
          <button class="link-button" data-auth-mode="login">Log in</button>
          <button class="link-button" data-auth-mode="signup">Sign up</button>
          <button class="link-button" data-auth-mode="forgot">Forgot password</button>
        </div>
      </section>
    </main>
  `;
}

function renderNav() {
  return `
    <aside class="sidebar ribbon-corners">
      <div class="sidebar-brand">
        <div class="brand-mark">RM</div>
        <div>
          <h2>Ribbon Muse</h2>
          <p>Creator suite</p>
        </div>
      </div>
      <nav class="sidebar-nav">
        ${NAV_ITEMS.map(
          (item) => `
            <button class="nav-item ${state.activeView === item.id ? "is-active" : ""}" data-nav="${item.id}">
              <span>${item.label}</span>
            </button>
          `
        ).join("")}
      </nav>
      <div class="sidebar-footer">
        <div class="mini-card">
          <span class="mini-label">Signed in</span>
          <strong>${escapeHtml(state.currentUser.name)}</strong>
          <small>${escapeHtml(state.currentUser.email)}</small>
        </div>
        <button class="secondary-button full-width" data-action="logout">Log out</button>
      </div>
    </aside>
  `;
}

function renderHeader() {
  const counts = {
    projects: state.library.length,
    prompts: state.prompts.length,
    looks: state.looks.length,
  };

  return `
    <section class="hero-panel ribbon-corners">
      <div>
        <div class="ribbon-badge">Reference-based AI styling and scene generator</div>
        <h1>One premium workflow for identity, styling, environments, and prompt-rich generations.</h1>
        <p>
          Upload references, guide the palette and brand energy, choose your scene direction, and keep every
          generation organized in a polished prompt vault.
        </p>
        <p class="muted">
          This prototype includes working auth, saved data, prompt generation, and local visual preview renders.
          The generation service is modular, so a live image API can replace the preview renderer later without changing the product flow.
        </p>
      </div>
      <div class="hero-stats">
        <div class="stat-card">
          <span>Projects</span>
          <strong>${counts.projects}</strong>
        </div>
        <div class="stat-card">
          <span>Prompt entries</span>
          <strong>${counts.prompts}</strong>
        </div>
        <div class="stat-card">
          <span>Saved looks</span>
          <strong>${counts.looks}</strong>
        </div>
      </div>
    </section>
  `;
}

function renderUploadGroup(group) {
  const items = state.createForm[group.key] || [];
  return `
    <section class="sub-card upload-card">
      <div class="sub-card-head">
        <div>
          <h4>${group.label}</h4>
          <p>Upload up to ${group.limit} references.</p>
        </div>
        <label class="upload-trigger">
          <input type="file" data-upload="${group.key}" ${group.limit > 1 ? "multiple" : ""} accept="image/*" />
          Add images
        </label>
      </div>
      <div class="upload-grid ${items.length ? "" : "is-empty"}">
        ${
          items.length
            ? items
                .map(
                  (item) => `
                    <article class="upload-thumb">
                      <img src="${item.dataUrl}" alt="${escapeHtml(item.name)}" />
                      <div class="thumb-meta">
                        <span>${escapeHtml(item.name)}</span>
                        <button class="icon-button" data-remove-image="${group.key}" data-image-id="${item.id}">Remove</button>
                      </div>
                    </article>
                  `
                )
                .join("")
            : `<div class="empty-drop">
                <span class="empty-ribbon"></span>
                <strong>No references yet</strong>
                <p>These uploads will be used inside the structured prompt engine and saved in future generations.</p>
              </div>`
        }
      </div>
    </section>
  `;
}

function renderChipGroup(options, selected, attr) {
  return `
    <div class="chip-grid">
      ${options
        .map(
          (option) => `
            <button
              type="button"
              class="chip ${selected === option ? "is-selected" : ""}"
              data-set="${attr}"
              data-value="${escapeHtml(option)}"
            >
              ${escapeHtml(option)}
            </button>
          `
        )
        .join("")}
    </div>
  `;
}

function renderLogoPlacement() {
  const options = ["chest", "bag", "shoes", "repeated pattern", "accessories"];
  return `
    <div class="chip-grid">
      ${options
        .map(
          (option) => `
            <button
              type="button"
              class="chip ${state.createForm.logoPlacement.includes(option) ? "is-selected" : ""}"
              data-toggle-array="logoPlacement"
              data-value="${option}"
            >
              ${option}
            </button>
          `
        )
        .join("")}
    </div>
  `;
}

function renderCreateView() {
  const form = state.createForm;
  const outputCount = selectedOutputCount(form);

  return `
    <section class="view-section">
      <div class="section-title-row">
        <div>
          <span class="section-kicker">Create</span>
          <h2>Build the full visual direction in one guided workspace</h2>
        </div>
        <div class="action-row">
          <button class="secondary-button" data-action="save-look">Save current look</button>
          <button class="primary-button" data-action="generate">Generate ${form.outputType === "single" ? "image" : form.outputType}</button>
        </div>
      </div>

      <section class="workspace-grid">
        <div class="main-column stack-xl">
          <section class="panel ribbon-corners">
            <div class="panel-heading">
              <span class="section-kicker">Project</span>
              <h3>Project setup</h3>
            </div>
            <label class="field">
              <span>Project title</span>
              <input type="text" name="projectTitle" value="${escapeHtml(form.projectTitle)}" />
            </label>
          </section>

          <section class="panel ribbon-corners">
            <div class="panel-heading">
              <span class="section-kicker">Section 1</span>
              <h3>Identity</h3>
              <p>Lock in who the subject is and how tightly the app should preserve her across outputs.</p>
            </div>
            <div class="stack-lg">
              ${FILE_GROUPS.slice(0, 2).map(renderUploadGroup).join("")}
              <div class="toggle-grid">
                <label class="toggle-card">
                  <input type="checkbox" name="keepSameFace" ${form.keepSameFace ? "checked" : ""} />
                  <div>
                    <strong>Keep same face</strong>
                    <span>High-priority identity lock for every generation.</span>
                  </div>
                </label>
                <label class="toggle-card">
                  <input type="checkbox" name="keepSameBody" ${form.keepSameBody ? "checked" : ""} />
                  <div>
                    <strong>Keep same body proportions</strong>
                    <span>Maintains consistent silhouette and proportions.</span>
                  </div>
                </label>
              </div>
              <label class="field">
                <span>Identity consistency strength <strong>${form.identityStrength}</strong></span>
                <input type="range" min="30" max="100" name="identityStrength" value="${form.identityStrength}" />
              </label>
            </div>
          </section>

          <section class="panel ribbon-corners">
            <div class="panel-heading">
              <span class="section-kicker">Section 2</span>
              <h3>Styling</h3>
              <p>Guide outfit, hair, accessories, and brand energy from references, suggestions, or a blend of both.</p>
            </div>
            <div class="stack-lg">
              ${FILE_GROUPS.slice(2, 5).map(renderUploadGroup).join("")}
              <div class="field-row">
                <label class="field">
                  <span>Outfit follow mode</span>
                  <select name="outfitMode">
                    ${["strict reference", "soft reference", "generated suggestion", "blended"]
                      .map((option) => `<option ${form.outfitMode === option ? "selected" : ""}>${option}</option>`)
                      .join("")}
                  </select>
                </label>
                <label class="field">
                  <span>Hair follow mode</span>
                  <select name="hairMode">
                    ${["strict reference", "soft reference", "generated suggestion", "blended"]
                      .map((option) => `<option ${form.hairMode === option ? "selected" : ""}>${option}</option>`)
                      .join("")}
                  </select>
                </label>
              </div>
              <label class="field">
                <span>Outfit suggestion category</span>
                <select name="outfitCategory">
                  ${OUTFIT_CATEGORIES.map((option) => `<option ${form.outfitCategory === option ? "selected" : ""}>${option}</option>`).join("")}
                </select>
              </label>
              <div class="field-row">
                <label class="field">
                  <span>Brand</span>
                  <select name="brand">
                    ${BRANDS.map((option) => `<option ${form.brand === option ? "selected" : ""}>${option}</option>`).join("")}
                  </select>
                </label>
                <label class="field">
                  <span>Brand mode</span>
                  <select name="brandMode">
                    ${[
                      { value: "none", label: "No brand" },
                      { value: "inspired", label: "Inspired styling only" },
                      { value: "visible", label: "Visible brand placement" },
                    ]
                      .map((item) => `<option value="${item.value}" ${form.brandMode === item.value ? "selected" : ""}>${item.label}</option>`)
                      .join("")}
                  </select>
                </label>
              </div>
              <div class="field-row">
                <label class="field">
                  <span>Logo visibility</span>
                  <select name="logoVisibility">
                    ${["subtle", "visible", "statement"].map((option) => `<option ${form.logoVisibility === option ? "selected" : ""}>${option}</option>`).join("")}
                  </select>
                </label>
              </div>
              <div class="field">
                <span>Logo placement preferences</span>
                ${renderLogoPlacement()}
              </div>
            </div>
          </section>

          <section class="panel ribbon-corners">
            <div class="panel-heading">
              <span class="section-kicker">Section 3</span>
              <h3>Colors and palette</h3>
              <p>Use color picks, names, and mood language to override or strongly guide the look.</p>
            </div>
            <div class="field-row">
              <label class="field color-field">
                <span>Primary color</span>
                <input type="color" name="primaryColor" value="${form.primaryColor}" />
              </label>
              <label class="field color-field">
                <span>Secondary color</span>
                <input type="color" name="secondaryColor" value="${form.secondaryColor}" />
              </label>
              <label class="field color-field">
                <span>Accent color</span>
                <input type="color" name="accentColor" value="${form.accentColor}" />
              </label>
            </div>
            <div class="field-row">
              <label class="field">
                <span>Color names / palette keywords</span>
                <input type="text" name="colorKeywords" value="${escapeHtml(form.colorKeywords)}" />
              </label>
              <label class="field">
                <span>Full palette mood</span>
                <input type="text" name="paletteMood" value="${escapeHtml(form.paletteMood)}" />
              </label>
            </div>
          </section>

          <section class="panel ribbon-corners">
            <div class="panel-heading">
              <span class="section-kicker">Section 4</span>
              <h3>Environment</h3>
              <p>Blend uploaded environment references with typed notes or let the app guide the setting.</p>
            </div>
            <div class="stack-lg">
              ${renderUploadGroup(FILE_GROUPS[5])}
              <div class="field-row">
                <label class="field">
                  <span>Environment follow mode</span>
                  <select name="environmentMode">
                    ${["strict image reference", "typed description only", "app suggestion", "blended"]
                      .map((option) => `<option ${form.environmentMode === option ? "selected" : ""}>${option}</option>`)
                      .join("")}
                  </select>
                </label>
                <label class="field">
                  <span>App-suggested environment preset</span>
                  <select name="environmentPreset">
                    ${ENVIRONMENT_PRESETS.map((option) => `<option ${form.environmentPreset === option ? "selected" : ""}>${option}</option>`).join("")}
                  </select>
                </label>
              </div>
              <label class="field">
                <span>Typed environment direction</span>
                <textarea name="environmentText" rows="4">${escapeHtml(form.environmentText)}</textarea>
              </label>
            </div>
          </section>

          <section class="panel ribbon-corners">
            <div class="panel-heading">
              <span class="section-kicker">Section 5</span>
              <h3>Pose, activity, and scene direction</h3>
              <p>Shape the visual story with pose, expression, framing, and motion logic.</p>
            </div>
            <div class="stack-lg">
              <div class="field">
                <span>Pose</span>
                ${renderChipGroup(POSES, form.pose, "pose")}
              </div>
              <div class="field">
                <span>Activity</span>
                ${renderChipGroup(ACTIVITIES, form.activity, "activity")}
              </div>
              <div class="field">
                <span>Story mode</span>
                ${renderChipGroup(STORY_MODES, form.storyMode, "storyMode")}
              </div>
              <div class="field-row">
                <label class="field">
                  <span>Expression</span>
                  <select name="expression">
                    ${EXPRESSIONS.map((option) => `<option ${form.expression === option ? "selected" : ""}>${option}</option>`).join("")}
                  </select>
                </label>
                <label class="field">
                  <span>Framing</span>
                  <select name="framing">
                    ${FRAMING_OPTIONS.map((option) => `<option ${form.framing === option ? "selected" : ""}>${option}</option>`).join("")}
                  </select>
                </label>
              </div>
              <label class="field">
                <span>Motion / story direction</span>
                <input type="text" name="motionDirection" value="${escapeHtml(form.motionDirection)}" />
              </label>
            </div>
          </section>

          <section class="panel ribbon-corners">
            <div class="panel-heading">
              <span class="section-kicker">Section 6</span>
              <h3>Custom instructions</h3>
              <p>Add any extra creative direction while keeping identity locks intact.</p>
            </div>
            <label class="field">
              <span>Additional instructions</span>
              <textarea name="customInstructions" rows="5">${escapeHtml(form.customInstructions)}</textarea>
            </label>
          </section>

          <section class="panel ribbon-corners">
            <div class="panel-heading">
              <span class="section-kicker">Section 7</span>
              <h3>Output type</h3>
              <p>Choose a single hero image, a multi-slide carousel, or a themed scene set.</p>
            </div>
            <div class="field">
              <span>Output format</span>
              <div class="chip-grid">
                ${OUTPUT_TYPES.map(
                  (item) => `
                    <button type="button" class="chip ${form.outputType === item.id ? "is-selected" : ""}" data-set="outputType" data-value="${item.id}">
                      ${item.label}
                    </button>
                  `
                ).join("")}
              </div>
            </div>
            ${
              form.outputType !== "single"
                ? `
                  <div class="field-row">
                    <label class="field">
                      <span>${form.outputType === "carousel" ? "Carousel size" : "Scene-set size"}</span>
                      <select name="outputCount">
                        ${CAROUSEL_COUNTS.map((count) => `<option value="${count}" ${outputCount === count ? "selected" : ""}>${count} images</option>`).join("")}
                      </select>
                    </label>
                    <label class="field">
                      <span>${form.outputType === "carousel" ? "Carousel style" : "Sequence style"}</span>
                      <select name="carouselStyle">
                        ${CAROUSEL_STYLES.map((style) => `<option ${form.carouselStyle === style ? "selected" : ""}>${style}</option>`).join("")}
                      </select>
                    </label>
                  </div>
                `
                : ""
            }
          </section>
        </div>

        <aside class="side-column stack-xl">
          <section class="panel preview-panel ribbon-corners">
            <div class="panel-heading">
              <span class="section-kicker">Live brief</span>
              <h3>Prompt summary</h3>
            </div>
            <div class="stack-md">
              <div class="summary-row"><span>Identity lock</span><strong>${form.identityStrength}/100</strong></div>
              <div class="summary-row"><span>Outfit mode</span><strong>${escapeHtml(form.outfitMode)}</strong></div>
              <div class="summary-row"><span>Hair mode</span><strong>${escapeHtml(form.hairMode)}</strong></div>
              <div class="summary-row"><span>Brand</span><strong>${escapeHtml(form.brand)}</strong></div>
              <div class="summary-row"><span>Palette</span><strong>${escapeHtml(form.colorKeywords)}</strong></div>
              <div class="summary-row"><span>Environment</span><strong>${escapeHtml(form.environmentPreset)}</strong></div>
              <div class="summary-row"><span>Output</span><strong>${form.outputType === "single" ? "1 image" : `${outputCount} images`}</strong></div>
            </div>
            <div class="prompt-preview">
              ${escapeHtml(buildPrompt(form, 0))}
            </div>
          </section>

          ${
            state.generationResult
              ? renderResultsPanel()
              : `
                <section class="panel ribbon-corners empty-results">
                  <div class="empty-ribbon wide"></div>
                  <h3>Generated results will appear here</h3>
                  <p>
                    Once you generate, this area becomes your editorial result board with image previews first and the saved prompt vault underneath.
                  </p>
                </section>
              `
          }
        </aside>
      </section>
    </section>
  `;
}

function renderResultsPanel() {
  const result = state.generationResult;
  return `
    <section class="panel ribbon-corners results-panel">
      <div class="panel-heading">
        <span class="section-kicker">Results</span>
        <h3>${escapeHtml(result.title)}</h3>
        <p>Generated ${result.images.length} ${result.images.length === 1 ? "image" : "images"} with stored prompts.</p>
      </div>
      <div class="results-grid">
        ${result.images
          .map(
            (image, index) => `
              <article class="result-card">
                <img src="${image.url}" alt="Generated result ${index + 1}" />
                <div class="result-meta">
                  <strong>Image ${index + 1}</strong>
                  <span>${escapeHtml(image.subtitle)}</span>
                </div>
              </article>
            `
          )
          .join("")}
      </div>
      <div class="action-row wrap-top">
        <button class="secondary-button" data-action="copy-all-prompts">Copy all prompts</button>
        <button class="secondary-button" data-action="save-prompt-set">Save full set</button>
      </div>
      <p class="muted">
        These images are local editorial preview renders produced by the prototype generation layer. The prompt vault and data model are ready for a real AI image API hookup.
      </p>
      <div class="prompt-vault">
        ${result.prompts
          .map(
            (prompt, index) => `
              <details class="prompt-card" ${index === 0 ? "open" : ""}>
                <summary>
                  <div>
                    <span class="soft-label">Prompt ${index + 1}</span>
                    <strong>Detailed generation prompt</strong>
                  </div>
                  <span class="summary-mini">Image ${index + 1}</span>
                </summary>
                <div class="prompt-content">
                  <div class="prompt-toolbar">
                    <button class="link-button" data-copy-prompt="${index}">Copy prompt</button>
                    <button class="link-button" data-save-prompt="${index}">Save prompt</button>
                    <button class="link-button" data-regenerate-prompt="${index}">Regenerate from prompt</button>
                  </div>
                  <p>${escapeHtml(prompt)}</p>
                </div>
              </details>
            `
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderLibraryView() {
  return `
    <section class="view-section">
      <div class="section-title-row">
        <div>
          <span class="section-kicker">Library</span>
          <h2>Your past generations and image sets</h2>
        </div>
      </div>
      ${
        state.library.length
          ? `<div class="card-grid">
              ${state.library
                .map(
                  (project) => `
                    <article class="panel library-card ribbon-corners">
                      <img src="${project.result.images[0]?.url}" alt="${escapeHtml(project.title)} cover" />
                      <div class="stack-sm">
                        <div>
                          <h3>${escapeHtml(project.title)}</h3>
                          <p>${project.result.images.length} outputs • ${formatDate(project.updatedAt)}</p>
                        </div>
                        <div class="library-tags">
                          <span>${escapeHtml(project.settings.outfitCategory)}</span>
                          <span>${escapeHtml(project.settings.environmentPreset)}</span>
                          <span>${escapeHtml(project.settings.brand)}</span>
                        </div>
                        <div class="action-row">
                          <button class="secondary-button" data-load-project="${project.id}">Open in Create</button>
                        </div>
                      </div>
                    </article>
                  `
                )
                .join("")}
            </div>`
          : `<section class="panel ribbon-corners empty-state">
              <div class="empty-ribbon wide"></div>
              <h3>Your library is ready for its first generation</h3>
              <p>Generate from the Create tab and every set will show up here with reusable settings and stored prompts.</p>
            </section>`
      }
    </section>
  `;
}

function renderPromptsView() {
  const filtered = state.prompts.filter((entry) => {
    const text = `${entry.projectTitle} ${entry.prompt}`.toLowerCase();
    return text.includes(state.promptSearch.toLowerCase());
  });

  return `
    <section class="view-section">
      <div class="section-title-row">
        <div>
          <span class="section-kicker">Prompts</span>
          <h2>Search and reuse detailed prompt history</h2>
        </div>
      </div>
      <section class="panel ribbon-corners">
        <label class="field">
          <span>Search prompt vault</span>
          <input type="text" name="promptSearch" value="${escapeHtml(state.promptSearch)}" placeholder="Search by project, brand, environment, or styling..." />
        </label>
      </section>
      ${
        filtered.length
          ? `<div class="stack-lg">
              ${filtered
                .map(
                  (entry) => `
                    <article class="panel ribbon-corners">
                      <div class="section-title-row compact">
                        <div>
                          <span class="soft-label">${escapeHtml(entry.projectTitle)}</span>
                          <h3>Prompt ${entry.index + 1}</h3>
                          <p>${formatDate(entry.createdAt)}</p>
                        </div>
                        <div class="action-row">
                          <button class="secondary-button" data-copy-prompt-entry="${entry.id}">Copy</button>
                          <button class="secondary-button" data-reuse-entry="${entry.id}">Reuse in Create</button>
                        </div>
                      </div>
                      <div class="prompt-preview full">${escapeHtml(entry.prompt)}</div>
                    </article>
                  `
                )
                .join("")}
            </div>`
          : `<section class="panel ribbon-corners empty-state">
              <div class="empty-ribbon wide"></div>
              <h3>No prompts match yet</h3>
              <p>Generate outputs or adjust your search to fill this prompt vault.</p>
            </section>`
      }
    </section>
  `;
}

function renderLooksView() {
  return `
    <section class="view-section">
      <div class="section-title-row">
        <div>
          <span class="section-kicker">Saved Looks</span>
          <h2>Reusable style recipes with references and settings snapshots</h2>
        </div>
      </div>
      ${
        state.looks.length
          ? `<div class="card-grid">
              ${state.looks
                .map(
                  (look) => `
                    <article class="panel ribbon-corners">
                      <div class="stack-sm">
                        <div>
                          <span class="soft-label">${escapeHtml(look.settings.brand)}</span>
                          <h3>${escapeHtml(look.name)}</h3>
                          <p>${formatDate(look.updatedAt)}</p>
                        </div>
                        <div class="library-tags">
                          <span>${escapeHtml(look.settings.outfitCategory)}</span>
                          <span>${escapeHtml(look.settings.storyMode)}</span>
                          <span>${escapeHtml(look.settings.paletteMood)}</span>
                        </div>
                        <div class="action-row">
                          <button class="secondary-button" data-load-look="${look.id}">Apply to Create</button>
                        </div>
                      </div>
                    </article>
                  `
                )
                .join("")}
            </div>`
          : `<section class="panel ribbon-corners empty-state">
              <div class="empty-ribbon wide"></div>
              <h3>Save your best formulas here</h3>
              <p>Use “Save current look” from the Create page to preserve favorite references, colors, brand logic, and scene presets.</p>
            </section>`
      }
    </section>
  `;
}

function renderAccountView() {
  return `
    <section class="view-section">
      <div class="section-title-row">
        <div>
          <span class="section-kicker">Account</span>
          <h2>Creator profile and workspace summary</h2>
        </div>
      </div>
      <div class="card-grid two-up">
        <section class="panel ribbon-corners">
          <span class="soft-label">Profile</span>
          <h3>${escapeHtml(state.currentUser.name)}</h3>
          <p>${escapeHtml(state.currentUser.email)}</p>
          <p>Account created ${formatDate(state.currentUser.createdAt)}</p>
        </section>
        <section class="panel ribbon-corners">
          <span class="soft-label">Workspace storage</span>
          <h3>Local persistence enabled</h3>
          <p>This prototype stores accounts, generations, prompts, and saved looks in the browser so you can keep iterating without an external backend.</p>
        </section>
      </div>
      <section class="panel ribbon-corners">
        <span class="soft-label">Future-ready architecture</span>
        <h3>Prepared for backend and AI upgrades</h3>
        <p>
          The app structure separates auth, prompt building, output generation, and data persistence so Supabase,
          Firebase, real image APIs, billing, and future video workflows can be connected cleanly later.
        </p>
      </section>
    </section>
  `;
}

function renderMainView() {
  const views = {
    create: renderCreateView(),
    library: renderLibraryView(),
    prompts: renderPromptsView(),
    looks: renderLooksView(),
    account: renderAccountView(),
  };

  return `
    <main class="app-shell">
      ${renderNav()}
      <section class="content-shell">
        ${renderHeader()}
        ${state.notice ? `<div class="notice-banner">${escapeHtml(state.notice)}</div>` : ""}
        ${views[state.activeView]}
      </section>
    </main>
  `;
}

function render() {
  app.innerHTML = state.currentUser ? renderMainView() : renderAuth();
}

async function persistProject(project) {
  await putOne("projects", project);
  const promptEntries = project.result.prompts.map((prompt, index) => ({
    id: uid("prompt"),
    userId: state.currentUser.id,
    projectId: project.id,
    projectTitle: project.title,
    prompt,
    index,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }));

  for (const entry of promptEntries) {
    await putOne("prompts", entry);
  }
}

async function generateProject() {
  syncDerivedFields();
  const form = { ...state.createForm, outputCount: selectedOutputCount(state.createForm) };
  const prompts = buildPromptSet(form);
  const images = prompts.map((prompt, index) => ({
    id: uid("image"),
    url: buildMockImage({
      title: form.outfitCategory,
      subtitle: `${form.environmentPreset} • ${form.storyMode} • ${form.activity}`,
      palette: pickPalette(form),
      index,
    }),
    subtitle: `${form.pose} • ${form.expression} • ${form.framing}`,
    prompt,
  }));

  const project = {
    id: uid("project"),
    userId: state.currentUser.id,
    title: form.projectTitle || "Untitled Muse Project",
    createdAt: nowIso(),
    updatedAt: nowIso(),
    references: {
      faceImages: form.faceImages,
      bodyImages: form.bodyImages,
      outfitImages: form.outfitImages,
      hairImages: form.hairImages,
      accessoryImages: form.accessoryImages,
      environmentImages: form.environmentImages,
    },
    settings: {
      ...form,
      faceImages: undefined,
      bodyImages: undefined,
      outfitImages: undefined,
      hairImages: undefined,
      accessoryImages: undefined,
      environmentImages: undefined,
    },
    result: {
      title: form.projectTitle || "Untitled Muse Project",
      images,
      prompts,
    },
  };

  await persistProject(project);
  state.generationResult = project.result;
  state.selectedProjectId = project.id;
  await refreshUserData();
  setNotice("Generation set saved to your library.");
}

async function saveCurrentLook() {
  const look = {
    id: uid("look"),
    userId: state.currentUser.id,
    name: state.createForm.projectTitle || `${state.createForm.outfitCategory} look`,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    references: {
      faceImages: state.createForm.faceImages,
      bodyImages: state.createForm.bodyImages,
      outfitImages: state.createForm.outfitImages,
      hairImages: state.createForm.hairImages,
      accessoryImages: state.createForm.accessoryImages,
      environmentImages: state.createForm.environmentImages,
    },
    settings: { ...state.createForm },
  };
  await putOne("looks", look);
  await refreshUserData();
  setNotice("Look saved for later reuse.");
}

async function handleFileUpload(key, fileList) {
  const config = FILE_GROUPS.find((group) => group.key === key);
  if (!config) return;
  const files = Array.from(fileList).slice(0, config.limit);
  const mapped = await Promise.all(
    files.map(async (file) => ({
      id: uid("asset"),
      name: file.name,
      size: file.size,
      type: file.type,
      dataUrl: await fileToDataUrl(file),
    }))
  );
  state.createForm[key] = [...state.createForm[key], ...mapped].slice(0, config.limit);
  saveDraftLocally();
  render();
}

async function handleClick(event) {
  const target = event.target.closest("button");
  if (!target) return;

  if (target.dataset.authMode) {
    state.authMode = target.dataset.authMode;
    render();
    return;
  }

  if (target.dataset.nav) {
    state.activeView = target.dataset.nav;
    render();
    return;
  }

  if (target.dataset.action === "logout") {
    state.currentUser = null;
    state.generationResult = null;
    setSessionUserId(null);
    render();
    return;
  }

  if (target.dataset.set) {
    state.createForm[target.dataset.set] = target.dataset.value;
    if (target.dataset.set === "outputType" && target.dataset.value === "single") {
      state.createForm.outputCount = 1;
    }
    saveDraftLocally();
    render();
    return;
  }

  if (target.dataset.toggleArray) {
    const key = target.dataset.toggleArray;
    const value = target.dataset.value;
    const current = new Set(state.createForm[key]);
    if (current.has(value)) current.delete(value);
    else current.add(value);
    state.createForm[key] = [...current];
    saveDraftLocally();
    render();
    return;
  }

  if (target.dataset.removeImage) {
    const key = target.dataset.removeImage;
    state.createForm[key] = state.createForm[key].filter((item) => item.id !== target.dataset.imageId);
    saveDraftLocally();
    render();
    return;
  }

  if (target.dataset.action === "generate") {
    await generateProject();
    render();
    return;
  }

  if (target.dataset.action === "save-look") {
    await saveCurrentLook();
    return;
  }

  if (target.dataset.loadProject) {
    const project = await getOne("projects", target.dataset.loadProject);
    if (!project) return;
    state.createForm = formFromProject(project);
    state.generationResult = project.result;
    state.activeView = "create";
    saveDraftLocally();
    render();
    return;
  }

  if (target.dataset.loadLook) {
    const look = await getOne("looks", target.dataset.loadLook);
    if (!look) return;
    state.createForm = { ...structuredClone(DEFAULT_CREATE_STATE), ...look.settings, ...look.references };
    state.activeView = "create";
    saveDraftLocally();
    render();
    return;
  }

  if (target.dataset.copyPrompt) {
    const prompt = state.generationResult?.prompts?.[Number(target.dataset.copyPrompt)];
    if (!prompt) return;
    await navigator.clipboard.writeText(prompt);
    setNotice("Prompt copied.");
    return;
  }

  if (target.dataset.savePrompt) {
    const prompt = state.generationResult?.prompts?.[Number(target.dataset.savePrompt)];
    if (!prompt) return;
    await putOne("prompts", {
      id: uid("prompt"),
      userId: state.currentUser.id,
      projectId: state.selectedProjectId || uid("manual"),
      projectTitle: state.createForm.projectTitle,
      prompt,
      index: Number(target.dataset.savePrompt),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
    await refreshUserData();
    setNotice("Prompt saved.");
    return;
  }

  if (target.dataset.regeneratePrompt) {
    const index = Number(target.dataset.regeneratePrompt);
    const prompt = state.generationResult?.prompts?.[index];
    if (!prompt) return;
    const url = buildMockImage({
      title: `${state.createForm.outfitCategory} Remix`,
      subtitle: `Remix • ${state.createForm.environmentPreset} • ${state.createForm.activity}`,
      palette: pickPalette(state.createForm),
      index,
    });
    state.generationResult.images[index] = {
      ...state.generationResult.images[index],
      url,
      prompt,
    };
    render();
    setNotice("Prompt remixed into a fresh preview.");
    return;
  }

  if (target.dataset.action === "copy-all-prompts") {
    await navigator.clipboard.writeText(state.generationResult.prompts.join("\n\n"));
    setNotice("All prompts copied.");
    return;
  }

  if (target.dataset.action === "save-prompt-set") {
    for (const [index, prompt] of state.generationResult.prompts.entries()) {
      await putOne("prompts", {
        id: uid("prompt"),
        userId: state.currentUser.id,
        projectId: state.selectedProjectId || uid("manual"),
        projectTitle: state.createForm.projectTitle,
        prompt,
        index,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      });
    }
    await refreshUserData();
    setNotice("Prompt set saved.");
    return;
  }

  if (target.dataset.copyPromptEntry) {
    const entry = await getOne("prompts", target.dataset.copyPromptEntry);
    if (!entry) return;
    await navigator.clipboard.writeText(entry.prompt);
    setNotice("Prompt copied.");
    return;
  }

  if (target.dataset.reuseEntry) {
    const entry = await getOne("prompts", target.dataset.reuseEntry);
    if (!entry) return;
    state.createForm.customInstructions = `${state.createForm.customInstructions}\nReuse prompt influence:\n${entry.prompt}`;
    state.activeView = "create";
    saveDraftLocally();
    render();
    setNotice("Prompt added into custom direction.");
  }
}

function handleChange(event) {
  const target = event.target;
  if (target.matches('input[type="file"][data-upload]')) {
    handleFileUpload(target.dataset.upload, target.files);
    target.value = "";
    return;
  }

  if (target.closest("#auth-form")) {
    return;
  }

  if (!target.name) return;

  if (target.type === "checkbox") {
    state.createForm[target.name] = target.checked;
  } else if (target.type === "range" || target.type === "number") {
    state.createForm[target.name] = Number(target.value);
  } else {
    state.createForm[target.name] = target.value;
  }

  if (target.name === "promptSearch") {
    state.promptSearch = target.value;
  } else {
    saveDraftLocally();
  }

  render();
}

async function handleSubmit(event) {
  event.preventDefault();
  const form = event.target;
  if (form.id === "auth-form") {
    await handleAuthSubmit(new FormData(form));
    render();
  }
}

async function bootstrap() {
  restoreDraftLocally();
  syncDerivedFields();
  state.currentUser = await loadCurrentUser();
  if (state.currentUser) {
    await refreshUserData();
  }
  render();
}

document.addEventListener("click", (event) => {
  handleClick(event).catch((error) => {
    console.error(error);
    setNotice("Something went wrong.");
  });
});
document.addEventListener("change", handleChange);
document.addEventListener("submit", (event) => {
  handleSubmit(event).catch((error) => {
    console.error(error);
    setNotice("Something went wrong.");
  });
});

bootstrap();
