export type ProductPresentation = {
  name: string;
  category: "Dogs" | "Cats" | "Everyday";
  description: string;
  icon: string;
  color: string;
};

export const productPresentation: Record<string, ProductPresentation> = {
  "cloud-bed": { name: "Cloud Nap Bed", category: "Dogs", description: "A washable, supportive bed for excellent naps.", icon: "☁️", color: "#dbe9df" },
  "mouse-toy": { name: "Wool Mouse Duo", category: "Cats", description: "Soft, natural-wool toys made for curious paws.", icon: "🐭", color: "#f4dfcf" },
  "walk-set": { name: "Everyday Walk Set", category: "Dogs", description: "A comfortable leash and harness for daily adventures.", icon: "🦮", color: "#d9e4ee" },
  "slow-bowl": { name: "Calm Eating Bowl", category: "Everyday", description: "A non-slip bowl that helps pets eat at an easy pace.", icon: "🥣", color: "#eee4cb" },
  "groom-brush": { name: "Gentle Groom Brush", category: "Everyday", description: "Rounded bristles for a calm, comfortable groom.", icon: "🪮", color: "#e3dced" },
  "treat-pouch": { name: "Pocket Treat Pouch", category: "Dogs", description: "A neat, washable pouch for training and walks.", icon: "🦴", color: "#ead9d2" }
};
