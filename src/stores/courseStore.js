import { ref } from "vue";
import { defineStore } from "pinia";

export const useCartStore = defineStore(
  "cart",
  () => {
    // 用setup的方式定義
    const courseCartStore = ref([]);
    return { courseCartStore };
  },
  {
    persist: [
      {
        paths: ["courseCartStore"],
        storage: localStorage,
      },
    ],
  }
);

export const useWishlistStore = defineStore(
  "wishlist",
  () => {
    // 用setup的方式定義
    const courseWishlistStore = ref([]);
    return { courseWishlistStore };
  },
  {
    persist: [
      {
        paths: ["courseWishlistStore"],
        storage: localStorage,
      },
    ],
  }
);

export const useCouponStore = defineStore(
  "coupon",
  () => {
    // 用setup的方式定義
    const courseCouponStore = ref({
      couponId: "",
      couponName: "",
      couponCode: "",
      couponDiscount: 0,
      couponUsed: 0,
    });
    return { courseCouponStore };
  },
  {
    persist: [
      {
        paths: ["courseCouponStore"],
        storage: localStorage,
      },
    ],
  }
);
