<template>
  <!-- 購物車 -->
  <section class="page-section" style="padding-top: 5%; padding-bottom: 5%">
    <div class="container ">
      <div class="row justify-content-center mb-5 mt-5">
        <div class="col-12 col-md-6 col-lg-6">
          <ProgressBar :percent="25"></ProgressBar>
        </div>
      </div>
      
      <div class="row justify-content-center">
        <div class="col-11 col-md-9 col-lg-8">
          <div class="p-2 bg-light border">
            <ul class="nav nav-tabs">
              <li class="nav-item">
                <button
                  class="nav-link"
                  :class="{
                    active: pageState.isActiveOrDisableCart,
                    disabled: pageState.isActiveOrDisableCart,
                  }"
                  @click="changePage('cart')"
                >
                  購物車
                </button>
              </li>
              <li class="nav-item">
                <button
                  class="nav-link"
                  :class="{
                    active: pageState.isActiveOrDisableWishlist,
                    disabled: pageState.isActiveOrDisableWishlist,
                  }"
                  @click="changePage('wishlist')"
                >
                  我的願望清單
                </button>
              </li>
              <li class="nav-item">
                <button
                  class="nav-link"
                  :class="{
                    active: pageState.isActiveOrDisableCoupon,
                    disabled: pageState.isActiveOrDisableCoupon,
                  }"
                  @click="changePage('coupon')"
                >
                  折價券
                </button>
              </li>
            </ul>
          </div>

          <div class="p-2 bg-light border">
            <table
              v-if="cartOrWishListOrCoupon == 'cart'"
              class="table align-middle text-center"
            >
              <thead class="table-light">
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">課程圖片</th>
                  <th scope="col">課程名稱</th>
                  <th scope="col">課程教練</th>
                  <th scope="col">課程時間</th>
                  <th scope="col">單價</th>
                  <th scope="col"></th>
                </tr>
              </thead>
              <tbody v-for="(item, index) in pageClasses">
                <tr>
                  <th scope="row">{{ index + 1 }}</th>
                  <td>
                    <!-- <img src=https://picsum.photos/id/17/200 alt="..." /> -->
                    <img
                      v-show="loadImgFactor"
                      :src="`${URL}/course/getImg?cid=${item.courseId}`"
                      class="cart-img-left mt-3"
                      alt="not Found"
                      @load="loadImg"
                    />
                  </td>
                  <td>{{ item.courseName }}</td>
                  <td>{{ item.employeename }}</td>
                  <td>{{ item.classDate }}&nbsp;{{ item.classTime }}</td>
                  <td>NT$ &nbsp;{{ item.price.toLocaleString() }}</td>
                  <td>
                    <div
                      type="button"
                      class="bi bi-heart-fill"
                      @click="addToWishlist(item.classId)"
                    ></div>
                    <div
                      type="button"
                      class="bi bi-trash-fill"
                      @click="deleteCartItem(item.classId)"
                    ></div>
                  </td>
                </tr>
              </tbody>
            </table>
            <!-- wishlist -->
            <courseWishlist
              v-else-if="cartOrWishListOrCoupon == 'wishlist'"
            ></courseWishlist>
          </div>
          <!-- Coupon page start -->
          <div class="p-2 bg-light border">
            <div
              class="rol-12 rol-md-9 row-lg-8"
              v-if="cartOrWishListOrCoupon == 'coupon'"
            >
              <memberCoupon></memberCoupon>
            </div>
          </div>
          <!-- Coupon page End -->
        </div>
        <!-- 結帳 card start -->
        <div
          v-if="cartOrWishListOrCoupon == 'cart'"
          class="col-12 col-md-3 col-lg-2"
        >
          <div class="card">
            <div class="card-body">
              <h4 class="card-title">總價:</h4>
              <p class="card-text">
                NT$&nbsp;{{ totalPrice.toLocaleString() }}
              </p>
              <div class="d-grid gap-3 col-12 mx-auto">
                <button
                  class="btn btn-primary"
                  :class="{
                    disabled: isCheckoutButtonActive,
                  }"
                  @click="toCheckoutOrNot"
                >
                  結帳
                </button>
              </div>
            </div>
          </div>
          <!-- back -->
          <div class="row justify-content-center">
            <router-link class="col-8 my-4 text-center" to="/course/0">
              <button class="btn btn-primary">繼續購課</button>
            </router-link>
          </div>
          <!-- back -->
        </div>
        <!-- 結帳 card end -->
      </div>
    </div>
  </section>
</template>

<script setup>
/*
  imports
 */
import { ref, reactive, onMounted, computed, watch, onUpdated } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import { useDialog, useMessage } from "naive-ui";
import { useCartStore, useWishlistStore } from "../stores/courseStore.js";
import { storeToRefs } from "pinia";
import ProgressBar from "../components/checkout/util/progressbar.vue";
import courseWishlist from "../components/checkout/courseWishlist.vue";
import memberCoupon from "../components/checkout/memberCoupon.vue";
const URL = import.meta.env.VITE_API_JAVAURL;

/*
  Route
*/
const router = useRouter();

/*
  Decide which page to render
*/
const cartOrWishListOrCoupon = ref("cart");
const pageState = reactive({
  isActiveOrDisableCart: true,
  isActiveOrDisableWishlist: false,
  isActiveOrDisableCoupon: false,
});
const changePage = (pageName) => {
  if (pageName == "cart") {
    cartOrWishListOrCoupon.value = "cart";
    pageState.isActiveOrDisableCart = true;
    pageState.isActiveOrDisableWishlist = false;
    pageState.isActiveOrDisableCoupon = false;
  } else if (pageName == "wishlist") {
    if (localStorage.getItem("memberid") == "") {
      handleMessage("請先登入會員");
    } else {
      cartOrWishListOrCoupon.value = "wishlist";
      pageState.isActiveOrDisableCart = false;
      pageState.isActiveOrDisableWishlist = true;
      pageState.isActiveOrDisableCoupon = false;
    }
  } else {
    cartOrWishListOrCoupon.value = "coupon";
    pageState.isActiveOrDisableCart = false;
    pageState.isActiveOrDisableWishlist = false;
    pageState.isActiveOrDisableCoupon = true;
  }
};

/*
  watcher for page change
*/
watch(cartOrWishListOrCoupon, (newPageName) => {
  if (newPageName == "cart") {
    loadPageClasses();
  }
});

/*
  Store and relative responsive datas and local storage
*/
const cartStore = useCartStore();
const { courseCartStore } = storeToRefs(cartStore);
const wishlistStore = useWishlistStore();
const { courseWishlistStore } = storeToRefs(wishlistStore);

/*
  Load datas
*/

// Load Classes data
const pageClasses = ref([]);
const loadPageClasses = async () => {
  const URLAPI = `${URL}/classes/findClassesByIds`;
  const response = await axios
    .post(URLAPI, courseCartStore.value)
    .catch((error) => {
      console.log(error.toJSON());
    });
  // console.log(response);

  pageClasses.value = response.data;
  // console.log(pageClasses);
};

// Load CourseImg
const loadImgFactor = ref(false);
const loadImg = () => {
  loadImgFactor.value = true;
};

// Load alreadyBuyAmount
const URLAPIALREADYBUY = `${URL}/order-items/getOrderItemAmountByClassId`;
const getAlreadyBuy = (classId) =>
  axios
    .get(URLAPIALREADYBUY, {
      params: {
        classId: classId,
      },
    })
    .catch((error) => {
      console.log(error.toJSON());
    });

/*
  computed total price
*/

const totalPrice = computed(() => {
  let sum = 0;
  for (let i = 0; i < pageClasses.value.length; i++) {
    sum += pageClasses.value[i].price;
  }
  return sum;
});

/*
  Methods for delete cart items
*/

// Delete single cart items throuth deleting in store
const deleteCartItem = (classId) => {
  courseCartStore.value.splice(courseCartStore.value.indexOf(classId), 1);
  handleMessage("已刪除您的購物車商品");
};

/*
  watcher for cart items in store
*/
watch(courseCartStore.value, () => {
  loadPageClasses();
});

/*
  method for add and delete item to wishlish DB
*/
// add item to wishlish DB
const AddWishlistItemToDB = async (classId) => {
  const reswishlist = await axios
    .post(`${URL}/wishlist`, {
      memberId: localStorage.getItem("memberid"),
      classId: classId,
    })
    .catch((error) => {
      console.log(error.toJSON());
    });
};

/*
  Add classes to courseWishlistStore and local storage
*/
const addToWishlist = (classId) => {
  if (localStorage.getItem("memberid") == "") {
    handleMessage("請先登入會員");
  } else {
    // Delete utem from cart ,then add to wishlist and DB
    if (!courseWishlistStore.value.includes(classId)) {
      deleteCartItem(classId);
      courseWishlistStore.value.push(classId);
      AddWishlistItemToDB(classId);
      console.log(courseWishlistStore.value);

      // Use Naive UI Dialog
      handleMessage("課程已成功加入願望清單");
    } else {
      handleMessage("課程已存在您的願望清單");
    }
  }
};

/*
  Go to checkout or not
*/

// button active verification
const isCheckoutButtonActive = ref(null);
const CheckoutButtonActive = () => {
  if (totalPrice.value == 0) {
    isCheckoutButtonActive.value = true;
  } else {
    isCheckoutButtonActive.value = false;
  }
};

//
const toCheckoutOrNot = async () => {
  if (localStorage.getItem("memberid") == "") {
    handleMessage("請先登入會員");
    return;
  }

  // soldout verification
  let i = 0;
  for (let classId of courseCartStore.value) {
    const res = await getAlreadyBuy(classId);
    if (res.data["applicantsCeil"] - res.data["orderAmount"] <= 0) {
      handleWarning(`很抱歉，${res.data["courseName"]}課程已經售完囉!`);
      deleteCartItem(res.data["classId"]);
      return;
    }
    i++;
  }

  router.push("checkout");
};

/*
  Naive UI success modal
*/
const dialog = useDialog();
const messageNaive = useMessage();
const handleSuccess = (contentText) => {
  dialog.success({
    title: "Success",
    content: contentText,
    positiveText: "確定",
  });
};
const handleWarning = (contentText) => {
  dialog.warning({
    title: "可惜了",
    content: contentText,
    positiveText: "確定",
  });
};
const handleMessage = (messageText) => {
  messageNaive.info(messageText, {
    closable: true,
    duration: 5000,
  });
};

/*
  LifeCycle Hooks
*/
onMounted(() => {
  loadPageClasses();
  CheckoutButtonActive();
});

onUpdated(() => {
  CheckoutButtonActive();
});
</script>

<style scoped>
.btn-primary {
  --bs-btn-color: #fff;
  --bs-btn-bg: #ffc408;
  --bs-btn-border-color: #fff;
  --bs-btn-hover-bg: #e83015;
  --bs-btn-hover-border-color: #c34e2e;
  --bs-btn-active-bg: #c34e2e;
}
.cart-img-left {
  width: 50%;
  height: 50%;
}
</style>
