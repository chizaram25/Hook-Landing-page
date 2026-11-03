type MetaPixelWindow = Window & {
  fbq?: (...args: unknown[]) => void;
};

export const trackWaitlistSignup = () => {
  if (typeof window === "undefined") return;

  const metaWindow = window as MetaPixelWindow;

  metaWindow.fbq?.("track", "Lead", {
    content_name: "Hook Waitlist",
    content_category: "Waitlist Signup",
  });
};
