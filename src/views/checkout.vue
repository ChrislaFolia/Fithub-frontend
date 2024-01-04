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
                <option value="2">LINE PAY</option>
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
                NT$&nbsp;{{ (totalPrice - couponDiscount).toLocaleString() }}
              </p>
              <div v-if="error">{{ error }}</div>
              <!-- 顯示折扣金額 -->
              <div v-else-if="couponDiscount">
                折扣 NT$ {{ couponDiscount }}
              </div>
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
              <div id="alertContainer" class="alert-container"></div>
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
                    <button
                      type="submit"
                      class="btn btn-primary mb-3"
                      @click="submitCoupon"
                    >
                      輸入
                    </button>
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
import { ref, onMounted, computed, watch } from "vue";
import { useRoute } from "vue-router";
import { useCartStore } from "../stores/courseStore.js";
import { storeToRefs } from "pinia";
import axios from "axios";
import ProgressBar from "../components/checkout/util/progressbar.vue";
const URL = import.meta.env.VITE_API_JAVAURL;

/*
  Store and relative responsive datas and local storage
*/
const cartStore = useCartStore();
const { courseCartStore } = storeToRefs(cartStore);

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

/*
  Submit Coupon Data
*/
const couponCode = ref("");
const couponDiscount = ref("");
const couponenddate = ref("");
const couponthreshold = ref("");
const error = ref("");
const couponId = ref("");

const submitCoupon = async () => {
  try {
    // console.log(couponCode.value);
    const response = await axios.get(`${URL}/coupons/api/${couponCode.value}`, {
      couponcode: couponCode.value,
    });

    if (response.status === 200) {
      console.log(response.data);
      couponDiscount.value = response.data.coupondiscount;
      couponenddate.value = response.data.couponenddate;
      couponthreshold.value = response.data.couponthreshold;
      // couponId.value = response.data.couponid;
      // console.log(couponId.value);
      // 獲取當前日期
      const currentDate = new Date();

      // 將截止日期字串解析為日期對象
      const couponEndDate = new Date(couponenddate.value);

      // 確保為數字類型
      const couponUsed = parseInt(response.data.couponused, 10);
      const couponceil = parseInt(response.data.couponceil, 10);
      const couponId = parseInt(response.data.couponid, 10);
      console.log(couponId);

      // 檢查是否過期
      if (currentDate > couponEndDate) {
        showAlert("優惠已截止", "alert-danger");
        couponDiscount.value = "";
        localStorage.setItem("dis", "0");
        localStorage.setItem("used", "0");
        localStorage.setItem("cid", "0");
      } else {
        // 計算總金額
        const total = totalPrice.value;
        // 檢查是否達到使用門檻
        if (total < couponthreshold.value) {
          showAlert("總金額未達到使用門檻", "alert-warning");
          couponDiscount.value = "";
          localStorage.setItem("dis", "0");
          localStorage.setItem("used", "0");
          localStorage.setItem("cid", "0");
        } else {
          console.log(couponUsed);
          console.log(couponceil);
          // 檢查已使用量是否超出限制
          if (couponUsed >= couponceil) {
            showAlert("優惠券已用完", "alert-danger");
            couponDiscount.value = "";
            localStorage.setItem("dis", "0");
            localStorage.setItem("used", "0");
            localStorage.setItem("cid", "0");
          } else {
            // 可使用數量為超出限制，繼續處理優惠券
            var dis = couponDiscount.value;
            localStorage.setItem("dis", dis);
            showAlert("優惠碼已使用", "alert-success");
            var used = couponUsed;
            localStorage.setItem("used", used);
            var cid = couponId;
            localStorage.setItem("cid", cid);
            console.log(cid);
          }
        }
      }
    } else {
      showAlert("優惠券不存在", "alert-danger"); // 處理後端返回的錯誤
      couponDiscount.value = "";
      localStorage.setItem("dis", "0");
      localStorage.setItem("used", "0");
      localStorage.setItem("cid", "0");
    }
  } catch (err) {
    console.error(err);
    showAlert("優惠券不存在", "alert-danger");
    couponDiscount.value = "";
    localStorage.setItem("dis", "0");
    localStorage.setItem("used", "0");
    localStorage.setItem("cid", "0");
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
  Go to checkout or not
*/

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
