<template>
  <!-- 結帳頁面 -->
  <section class="page-section" style="padding-top: 5%; padding-bottom: 5%">
    <div class="container">
      <div class="row justify-content-center mb-5 mt-5">
        <div class="col-10 col-md-6 col-lg-6">
          <ProgressBar :percent="50"></ProgressBar>
        </div>
      </div>

      <div class="row justify-content-center">
        <div class="col-11 col-md-9 col-lg-8">
          <div class="p-2 bg-light border">
            <table class="table align-middle text-center">
              <thead class="table-light">
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">圖片</th>
                  <th scope="col">課程名稱</th>
                  <th scope="col">課程教練</th>
                  <th scope="col">課程時間</th>
                  <th scope="col">單價</th>
                </tr>
              </thead>
              <tbody v-for="(item, index) in pageClasses">
                <tr>
                  <td scope="row">{{ index + 1 }}</td>
                  <td>
                    <!-- <img
                      :src="`https://picsum.photos/300?random=${index + 15}`"
                      style="width: 200px"
                    /> -->
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
                </tr>
              </tbody>
              <tbody>
                <tr>
                  <td></td>
                  <td></td>
                  <td></td>
                  <!-- 顯示折扣金額 -->
                  <td>折扣</td>
                  <td>{{ courseCouponStore.couponName }}</td>
                  <td>NT$ {{ -courseCouponStore.couponDiscount }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="p-2 bg-light border">
            <div class="form-floating">
              <select
                class="form-select"
                id="floatingSelect"
                v-model="payMethod"
                required
              >
                <option selected value="null" style="display: none">
                  選擇付款方式
                </option>
                <option value="1">信用卡-綠界金流</option>
                <!-- <option value="2">LINE PAY</option> -->
              </select>
              <label for="floatingSelect">Pay with selects</label>
            </div>
          </div>
        </div>
        <!-- 結帳 card -->
        <div class="col-12 col-md-3 col-lg-2">
          <div class="card">
            <div class="card-body">
              <h4 class="card-title">總價:</h4>
              <p class="card-text">
                NT$&nbsp;{{
                  (
                    totalPrice - courseCouponStore.couponDiscount
                  ).toLocaleString()
                }}
              </p>
              <div class="d-grid gap-3 col-12 mx-auto">
                <router-link
                  class="btn btn-primary"
                  :class="{
                    disabled: isCheckoutButtonActive,
                  }"
                  to="/ordercheck"
                  >結帳</router-link
                >
              </div>
            </div>
            <hr />
            <div class="row mx-auto">
              <h5>優惠券</h5>
              <div
                v-show="courseCouponStore.couponDiscount > 0"
                id="alertContainer"
                class="alert-container"
              ></div>
              <div class="col-12">
                <label for="inputPassword2" class="visually-hidden"
                  >促銷代碼</label
                >
                <input
                  type="text"
                  class="form-control"
                  v-model="couponCode"
                  id="inputPassword2"
                  placeholder="促銷代碼"
                />
              </div>
              <div class="col-12 my-2">
                <div class="row d-grid justify-content-end">
                  <div class="col-12">
                    <div class="row mt-2">
                      <div class="col-12 col-lg-6">
                        <button
                          type="button"
                          class="btn btn-primary mb-3"
                          :class="{
                            disabled: !couponCode,
                          }"
                          @click="clearCouponCode"
                        >
                          清除
                        </button>
                      </div>
                      <div class="col-12 col-lg-6">
                        <button
                          type="submit"
                          class="btn btn-primary mb-3"
                          @click="submitCoupon"
                        >
                          套用
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <!-- back -->
          <div class="row justify-content-center">
            <router-link class="col-8 my-4 text-center" to="/cart">
              <button class="btn btn-primary">回上頁</button>
            </router-link>
          </div>
          <!-- back -->
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
/*
  imports
 */
import { ref, onMounted, computed, watch, reactive } from "vue";
import { useRoute } from "vue-router";
import { useCartStore, useCouponStore } from "../stores/courseStore.js";
import { storeToRefs } from "pinia";
import axios from "axios";
import ProgressBar from "../components/checkout/util/progressbar.vue";
const URL = import.meta.env.VITE_API_JAVAURL;

/*
  Store and relative responsive datas and local storage
*/
const cartStore = useCartStore();
const couponStore = useCouponStore();
const { courseCartStore } = storeToRefs(cartStore);
const { courseCouponStore } = storeToRefs(couponStore);

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

  pageClasses.value = response.data;
};

// Load CourseImg
const loadImgFactor = ref(false);
const loadImg = () => {
  loadImgFactor.value = true;
};

/*
  Submit Coupon Data
*/
const couponData = reactive({
  couponcategoriesid: "",
  couponId: "",
  couponName: "",
  couponDiscount: 0,
  couponEndDate: new Date(),
  couponthreshold: 0,
  couponused: 0,
  couponceil: 0,
});
const couponCode = ref("");
const error = ref("");

const submitCoupon = async () => {
  try {
    const response = await axios.get(`${URL}/coupons/api/${couponCode.value}`, {
      couponcode: couponCode.value,
    });

    if (response.status === 200) {
      couponData.couponId = response.data.couponid;
      couponData.couponDiscount = parseInt(response.data.coupondiscount);
      couponData.couponName = response.data.couponname;
      couponData.couponEndDate = new Date(response.data.couponenddate);
      couponData.couponthreshold = response.data.couponthreshold;
      couponData.couponused = parseInt(response.data.couponused, 10);
      couponData.couponceil = parseInt(response.data.couponceil, 10);
      console.log(response.data);
      // 獲取當前日期
      const currentDate = new Date();

      // 檢查是否過期
      if (currentDate > couponData.couponEndDate) {
        showAlert("優惠已截止", "alert-danger");
        resetCouponData();
        clearCourseCouponStore();
      } else {
        // 計算總金額
        const total = totalPrice.value;
        // 檢查是否達到使用門檻
        if (total < couponData.couponthreshold) {
          showAlert("總金額未達到使用門檻", "alert-warning");
          resetCouponData();
          clearCourseCouponStore();
        } else {
          // 檢查已使用量是否超出限制
          if (couponData.couponused >= couponData.couponceil) {
            showAlert("優惠券已用完", "alert-danger");
            resetCouponData();
            setCourseCouponStore("", "", 0, 0);
          } else {
            // 可使用數量為超出限制，繼續處理優惠券
            setCourseCouponStore(
              couponData.couponId,
              couponData.couponName,
              couponData.couponDiscount,
              couponData.couponused
            );
            showAlert("優惠碼已使用", "alert-success");
          }
        }
      }
    } else {
      showAlert("優惠券不存在", "alert-danger"); // 處理後端返回的錯誤
      resetCouponData();
      clearCourseCouponStore();
    }
  } catch (err) {
    console.error(err);
    showAlert("優惠券不存在", "alert-danger");
    resetCouponData();
  }
};

function showAlert(message, alertClass) {
  const alertContainer = document.getElementById("alertContainer");
  const alertElement = document.createElement("div");
  alertElement.className = `alert ${alertClass}`;
  alertElement.textContent = message;

  // 清空容器並添加警告元素
  alertContainer.innerHTML = "";
  alertContainer.appendChild(alertElement);
}

/*
  Methods
*/

// Method for go to checkout or not
// button active verification
const isCheckoutButtonActive = ref(true);
const payMethod = ref(null);
const CheckoutButtonActive = () => {
  if (!payMethod) {
    isCheckoutButtonActive.value = true;
  } else {
    isCheckoutButtonActive.value = false;
  }
};

// Method for deleting couponCode
const clearCouponCode = () => {
  couponCode.value = "";
  resetCouponData();
  clearCourseCouponStore();
};

// Method for reset coupon data
const resetCouponData = () => {
  couponData.couponcategoriesid = "";
  couponData.couponId = "";
  couponData.couponName = "";
  couponData.couponDiscount = 0;
  couponData.couponEndDate = new Date();
  couponData.couponthreshold = 0;
  couponData.couponused = 0;
  couponData.couponceil = 0;
};

// Method for put coupon data into courseCouponStore
const setCourseCouponStore = (
  couponId,
  couponName,
  couponDiscount,
  couponused
) => {
  courseCouponStore.value.couponId = couponId;
  courseCouponStore.value.couponName = couponName;
  courseCouponStore.value.couponDiscount = couponDiscount;
  courseCouponStore.value.couponUsed = couponused;
};

const clearCourseCouponStore = () => {
  setCourseCouponStore("", "", 0, 0);
};

/*
  watcher for page change
*/
watch(payMethod, () => {
  CheckoutButtonActive();
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
  LifeCycle Hooks
*/
onMounted(() => {
  loadPageClasses();
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
