// Background colors for avatars: each entry is a gradient (start color → end color).
const AVATAR_GRADIENTS = [
  "from-[#ff8a65] to-[#ff5252]", // orange → red
  "from-[#4fc3f7] to-[#4f7cff]", // light blue → blue
  "from-[#81c784] to-[#26a69a]", // green → teal
  "from-[#ba68c8] to-[#7e57c2]", // pink-purple → purple
  "from-[#ffd54f] to-[#ffa726]", // yellow → orange
];

/**
 * Picks a gradient based on the chat title, so the same chat
 * always gets the same color.
 */
function pickGradient(title: string): string {
  let sumOfCharCodes = 0;
  for (const char of title) {
    sumOfCharCodes += char.charCodeAt(0);
  }
  const index = sumOfCharCodes % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[index];
}

/**
 * Returns the first letter of the title in upper case.
 * A leading "+" (phone numbers like "+79991234567") is skipped.
 */
function getInitial(title: string): string {
  const titleWithoutPlus = title.startsWith("+") ? title.slice(1) : title;
  const firstLetter = titleWithoutPlus.charAt(0).toUpperCase();
  return firstLetter || "?";
}

type AvatarProps = {
  title: string;
  /** Diameter in pixels. */
  size?: number;
};

/** A round avatar with a colored background and the chat's first letter. */
export default function Avatar({ title, size = 48 }: AvatarProps) {
  const gradient = pickGradient(title);
  const initial = getInitial(title);

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-semibold text-white ${gradient}`}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.4, // letter takes ~40% of the circle
      }}
    >
      {initial}
    </div>
  );
}
