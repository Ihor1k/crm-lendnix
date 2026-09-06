import { enterDemo } from "../utils/session.js";
import lendnixLogoUrl from "../images/lendnix-logo.svg?url";

const eyeOpen = `
<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
<path d="M6.99951 3.64551C8.49889 3.64552 9.78485 4.30535 10.7798 5.08203C11.7755 5.85938 12.5115 6.77807 12.9233 7.35547C13.0772 7.57118 13.2707 7.81528 13.271 8.16602C13.271 8.51705 13.0773 8.76172 12.9233 8.97754C12.5116 9.55483 11.7753 10.4727 10.7798 11.25C9.78483 12.0267 8.49898 12.6875 6.99951 12.6875C5.50016 12.6874 4.2151 12.0267 3.22021 11.25C2.22462 10.4727 1.48841 9.5549 1.07666 8.97754C0.922721 8.76171 0.729004 8.51709 0.729004 8.16602C0.729262 7.8152 0.922798 7.57121 1.07666 7.35547C1.48845 6.77806 2.22452 5.85936 3.22021 5.08203C4.21504 4.30548 5.50038 3.6456 6.99951 3.64551ZM6.99951 4.52051C5.76391 4.5206 4.66379 5.06466 3.7583 5.77148C3.07972 6.30125 2.52745 6.90961 2.13135 7.4082L1.78857 7.86328C1.69353 7.99654 1.64765 8.06239 1.62061 8.11426C1.60317 8.14782 1.60396 8.15696 1.604 8.16602C1.604 8.17534 1.60274 8.18433 1.62061 8.21875C1.64762 8.27065 1.69342 8.33631 1.78857 8.46973C2.17366 9.00971 2.85381 9.85434 3.7583 10.5605C4.66385 11.2675 5.76376 11.8124 6.99951 11.8125C8.23528 11.8125 9.33514 11.2675 10.2407 10.5605C11.1454 9.85426 11.8263 9.00973 12.2114 8.46973C12.3065 8.33645 12.3514 8.27062 12.3784 8.21875C12.3963 8.18426 12.396 8.17535 12.396 8.16602C12.396 8.15694 12.396 8.14804 12.3784 8.11426C12.3514 8.0624 12.3064 7.99647 12.2114 7.86328C11.8263 7.32323 11.1453 6.4777 10.2407 5.77148C9.33523 5.06474 8.23506 4.52052 6.99951 4.52051ZM6.99951 5.97949C8.20766 5.97949 9.18701 6.95884 9.18701 8.16699C9.18686 9.37502 8.20757 10.3545 6.99951 10.3545C5.79158 10.3543 4.81216 9.37492 4.81201 8.16699C4.81201 6.95894 5.79149 5.97965 6.99951 5.97949ZM6.99951 6.85449C6.27474 6.85465 5.68701 7.44219 5.68701 8.16699C5.68716 8.89167 6.27483 9.47934 6.99951 9.47949C7.72432 9.47949 8.31186 8.89177 8.31201 8.16699C8.31201 7.44209 7.72441 6.85449 6.99951 6.85449ZM6.99951 1.3125C8.73764 1.31251 10.2847 2.0965 11.3735 2.84863C11.922 3.2275 12.3656 3.60551 12.6724 3.88965C12.826 4.03194 12.9455 4.15178 13.0278 4.23633C13.069 4.27858 13.1015 4.31235 13.1235 4.33594C13.1343 4.34753 13.143 4.35676 13.1489 4.36328C13.1519 4.36649 13.154 4.36919 13.1558 4.37109L13.1587 4.37402V4.375C13.3197 4.55484 13.305 4.83094 13.1255 4.99219C12.968 5.13317 12.7361 5.13972 12.5728 5.01855L12.5073 4.95898L12.5063 4.95801C12.5055 4.95711 12.5043 4.95519 12.5024 4.95312C12.4984 4.9487 12.4917 4.942 12.4829 4.93262C12.4651 4.91349 12.4374 4.88414 12.4009 4.84668C12.3279 4.77178 12.2189 4.66314 12.0776 4.53223C11.7941 4.26955 11.3825 3.91858 10.8755 3.56836C9.85315 2.86224 8.48284 2.18751 6.99951 2.1875C5.51616 2.1876 4.14583 2.86223 3.12354 3.56836C2.6166 3.91853 2.2059 4.26958 1.92236 4.53223C1.78087 4.6633 1.67116 4.77174 1.59814 4.84668C1.56175 4.88403 1.5349 4.91351 1.51709 4.93262C1.50842 4.94192 1.50163 4.94867 1.49756 4.95312C1.49557 4.9553 1.4935 4.95712 1.49268 4.95801V4.95898C1.33147 5.13886 1.05447 5.15333 0.874512 4.99219C0.694775 4.83097 0.680211 4.55393 0.841309 4.37402V4.37305C0.841893 4.37246 0.843402 4.37202 0.844238 4.37109C0.845961 4.36918 0.848184 4.36645 0.851074 4.36328C0.857052 4.35674 0.865615 4.34758 0.876465 4.33594C0.898397 4.31241 0.9302 4.27841 0.971191 4.23633C1.05357 4.15178 1.17405 4.03192 1.32764 3.88965C1.63441 3.60549 2.07804 3.22746 2.62646 2.84863C3.71527 2.09656 5.26152 1.3126 6.99951 1.3125Z" fill="#666666"/>
</svg>
`;

const eyeOff = `
<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
<path d="M12.4424 4.17933C12.5505 3.9635 12.8133 3.87515 13.0293 3.98304C13.2453 4.09102 13.3323 4.35393 13.2246 4.56995L12.834 4.37464L13.2246 4.57093L13.2236 4.57191C13.2232 4.57272 13.2232 4.57458 13.2227 4.57581C13.2214 4.5784 13.219 4.58239 13.2168 4.58656C13.2124 4.59507 13.2061 4.60717 13.1983 4.62171C13.1823 4.6514 13.1583 4.69364 13.1279 4.74574C13.067 4.85024 12.9764 4.99739 12.8555 5.17152C12.6371 5.48591 12.3161 5.89304 11.8867 6.31019L12.8506 7.27406C13.0215 7.44491 13.0215 7.72137 12.8506 7.89222C12.6797 8.06299 12.4033 8.06305 12.2324 7.89222L11.2227 6.88343C10.8293 7.1851 10.3747 7.472 9.85451 7.70765L10.3233 8.87953C10.4126 9.10355 10.3039 9.35798 10.0801 9.44788C9.85593 9.53755 9.60069 9.42869 9.51076 9.20472L9.03517 8.01429C8.54845 8.16199 8.01682 8.26429 7.43752 8.29847V9.62464C7.43752 9.86627 7.24164 10.0621 7.00002 10.0621C6.75848 10.062 6.56252 9.86621 6.56252 9.62464V8.29847C5.98328 8.26428 5.45147 8.16296 4.96486 8.01527L4.49025 9.20472C4.40049 9.42859 4.14594 9.53704 3.92189 9.44788C3.69761 9.35817 3.58814 9.10383 3.67775 8.87953L4.14553 7.70765C3.6251 7.47182 3.16982 7.18532 2.77638 6.88343L1.76857 7.89222C1.59779 8.063 1.3203 8.06284 1.14943 7.89222C0.978957 7.72139 0.978848 7.44482 1.14943 7.27406L2.11232 6.31019C1.68309 5.89321 1.3628 5.48579 1.14455 5.17152C1.02349 4.99718 0.933077 4.85028 0.872088 4.74574C0.841713 4.69366 0.818762 4.65142 0.802752 4.62171C0.794929 4.60719 0.788622 4.59508 0.784197 4.58656C0.782009 4.58236 0.779665 4.57842 0.778338 4.57581C0.777684 4.57453 0.776817 4.57277 0.776385 4.57191V4.57093L0.775408 4.56995C0.667814 4.35395 0.755782 4.091 0.971697 3.98304C1.18749 3.87557 1.45047 3.96289 1.55861 4.17835C1.55896 4.17904 1.55944 4.18101 1.56056 4.18324C1.56296 4.18786 1.56754 4.19606 1.57326 4.20667C1.58483 4.22813 1.60293 4.26143 1.62795 4.30433C1.67853 4.39104 1.75681 4.51814 1.8633 4.67152C2.07709 4.97937 2.40391 5.39191 2.84963 5.80335C3.73884 6.62406 5.09558 7.43705 7.00002 7.43714C8.90467 7.4371 10.2621 6.62414 11.1514 5.80335C11.597 5.39196 11.923 4.97933 12.1367 4.67152C12.2433 4.51806 12.3225 4.39107 12.3731 4.30433C12.3981 4.26147 12.4162 4.22808 12.4278 4.20667C12.4335 4.19608 12.4381 4.18783 12.4404 4.18324C12.4415 4.18111 12.4421 4.17902 12.4424 4.17835V4.17933Z" fill="#666666"/>
</svg>
`;

const loaderMarkup = `
  <div class="login-loader" role="status" aria-live="polite" aria-label="Entering demo" hidden>
    <svg xmlns="http://www.w3.org/2000/svg" width="89" height="24" viewBox="0 0 89 24" fill="none" aria-hidden="true">
      <circle class="login-loader__dot" cx="6.261" cy="17.739" r="6.261" fill="#7B65FF"/>
      <circle class="login-loader__dot" cx="31.303" cy="13.565" r="7.826" fill="#7B65FF"/>
      <circle class="login-loader__dot" cx="56.35" cy="9.391" r="9.391" fill="#7B65FF"/>
      <circle class="login-loader__dot" cx="81.394" cy="14.452" r="7.493" fill="#7B65FF"/>
    </svg>
  </div>
`;

export function LoginPage({ onEnterDemo } = {}) {
  const state = {
    email: "",
    password: "",
    loading: false,
    showPassword: false,
  };

  let abortController = null;
  let enterTimer = 0;

  function canSubmit() {
    return Boolean(state.email.trim() && state.password.trim() && !state.loading);
  }

  function syncSubmit(root) {
    const submit = root.querySelector(".login-form__submit");
    if (submit) submit.disabled = !canSubmit();
  }

  function render(root) {
    root.innerHTML = `
      <main class="login-page">
        <img class="login-page__bg" src="${import.meta.env.BASE_URL}login-bg.png" alt="" aria-hidden="true" />
        <section class="login-page__card">
          <div class="login-page__body">
            <img
              class="login-page__logo"
              src="${lendnixLogoUrl}"
              alt="Lendnix"
              width="171"
              height="36"
            />
            <header class="login-page__header">
              <h1>Welcome to <br> Data Platform</h1>
              <p>Access the Demo Workspace</p>
            </header>
            <form class="login-form" id="login-form" novalidate>
              <label class="login-field" for="email">
                <span class="login-field__label">Email <span aria-hidden="true">*</span></span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autocomplete="username"
                  placeholder="Email"
                  aria-required="true"
                />
              </label>
              <label class="login-field" for="password">
                <span class="login-field__label">Password <span aria-hidden="true">*</span></span>
                <span class="login-field__control">
                  <input
                    id="password"
                    name="password"
                    type="${state.showPassword ? "text" : "password"}"
                    autocomplete="current-password"
                    placeholder="Password"
                    aria-required="true"
                  />
                  <button
                    class="login-field__toggle"
                    type="button"
                    aria-label="${state.showPassword ? "Hide password" : "Show password"}"
                    aria-pressed="${state.showPassword ? "true" : "false"}"
                  >
                    ${state.showPassword ? eyeOff : eyeOpen}
                  </button>
                </span>
              </label>
              <button class="login-form__submit" type="submit"${canSubmit() ? "" : " disabled"}>
                Enter Demo
              </button>
            </form>
            ${loaderMarkup}
          </div>
          <p class="login-page__note">Demo environment. Authentication is simulated.</p>
        </section>
      </main>
    `;

    const form = root.querySelector("#login-form");
    const email = root.querySelector("#email");
    const password = root.querySelector("#password");
    const toggle = root.querySelector(".login-field__toggle");
    const submit = root.querySelector(".login-form__submit");
    const loader = root.querySelector(".login-loader");
    const { signal } = abortController;

    email.value = state.email;
    password.value = state.password;

    email.addEventListener(
      "input",
      (event) => {
        state.email = event.target.value;
        syncSubmit(root);
      },
      { signal },
    );

    password.addEventListener(
      "input",
      (event) => {
        state.password = event.target.value;
        syncSubmit(root);
      },
      { signal },
    );

    toggle.addEventListener(
      "click",
      () => {
        state.showPassword = !state.showPassword;
        password.type = state.showPassword ? "text" : "password";
        toggle.setAttribute("aria-label", state.showPassword ? "Hide password" : "Show password");
        toggle.setAttribute("aria-pressed", state.showPassword ? "true" : "false");
        toggle.innerHTML = state.showPassword ? eyeOff : eyeOpen;
      },
      { signal },
    );

    form.addEventListener(
      "submit",
      (event) => {
        event.preventDefault();
        if (!canSubmit()) return;

        state.loading = true;
        submit.disabled = true;
        form.hidden = true;
        loader.hidden = false;
        root.querySelector(".login-page")?.setAttribute("aria-busy", "true");

        enterTimer = window.setTimeout(() => {
          enterDemo();
          onEnterDemo?.();
        }, 2000); 
      },
      { signal },
    );
  }

  return {
    mount(root) {
      abortController = new AbortController();
      render(root);
    },
    unmount() {
      window.clearTimeout(enterTimer);
      abortController?.abort();
      abortController = null;
    },
  };
}
