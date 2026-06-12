// LAUNCHPAD shared palette ("Verspielt & Bunt", app/src/main/res/values/colors.xml):
// lp_cream #FFF7EC · lp_peach #FFE7CE · lp_coral #FF7A59 · lp_coral_dark #E85D3D ·
// lp_sun #FFC53D · lp_mint #2BB673 · lp_sky #4FB0E5 · lp_grape #A06CD5 ·
// lp_ink #4A3A2E · lp_ink_soft #9B8779 · lp_line #EFE2D2
// VENT maps its semantic roles onto these tokens so the whole suite reads as one product.
export const colors = {
  canvas: {
    default: '#FFF7EC', // lp_cream
  },
  surface: {
    primary: '#FFFFFF', // lp_card
    secondary: '#FFF1DE', // cream→peach step
    tertiary: '#FFE7CE', // lp_peach
  },
  stroke: {
    subtle: '#EFE2D2', // lp_line
    default: '#E2D0BA',
    strong: '#C9B299',
  },
  text: {
    primary: '#4A3A2E', // lp_ink
    secondary: '#7A6757',
    tertiary: '#9B8779', // lp_ink_soft
    inverse: '#FFFFFF',
  },
  accent: {
    primary: {
      default: '#FF7A59', // lp_coral
      hover: '#E85D3D', // lp_coral_dark
      soft: '#FFE3D9',
    },
    secondary: {
      default: '#4FB0E5', // lp_sky
      soft: '#E1F1FA',
    },
  },
  semantic: {
    success: {
      default: '#2BB673', // lp_mint
      soft: '#DFF4E9',
    },
    warning: {
      default: '#D99E1B', // lp_sun, darkened for contrast
      soft: '#FFF3D6',
    },
    danger: {
      default: '#D64545',
      soft: '#FBE3E0',
    },
    info: {
      default: '#4FB0E5', // lp_sky
      soft: '#E1F1FA',
    },
  },
  state: {
    owned: '#2BB673', // lp_mint
    shared: '#4FB0E5', // lp_sky
    hidden: '#9B8779', // lp_ink_soft
    target: {
      hit: '#2BB673',
      near: '#D99E1B',
      miss: '#7A6757',
    },
    discount: '#FF7A59', // lp_coral
    installed: '#2BB673',
    unavailable: '#D64545',
  },
};
