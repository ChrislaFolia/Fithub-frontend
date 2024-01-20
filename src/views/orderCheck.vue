<template>
  <!-- 結帳頁面 -->
  <section class="page-section">
    <div class="container" style="padding-top: 5%; padding-bottom: 10%">
      <h1 class="text-center mb-5">訂單確認</h1>
      <!-- Progress Bar -->
      <div class="row justify-content-center mb-5">
        <div class="col-10 col-md-6 col-lg-6">
          <ProgressBar :percent="75"></ProgressBar>
        </div>
      </div>
      <!-- Order table start -->
      <div class="row justify-content-center">
        <div class="col-11 col-md-9 col-lg-7 mydiv">
          <div>
            <table class="table caption-top">
              <caption>
                訂單項目
              </caption>
              <thead class="table-light">
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">課程名稱</th>
                  <th scope="col">課程教練</th>
                  <th scope="col">課程時間</th>
                  <th scope="col">單價</th>
                  <!-- <th scope="col">折扣金額</th> -->
                </tr>
              </thead>
              <tbody v-for="(item, index) in pageClasses">
                <tr>
                  <th scope="row">{{ index + 1 }}</th>
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
                  <td>優惠券折扣</td>
                  <td>NT$ {{ -courseCouponStore.couponDiscount }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <!-- Order table end -->
          <hr />
          <!-- 訂購人資訊 start -->
          <div class="col-11 col-md-9 col-lg-7">
            <div style="display: flex; align-items: center">
              <div class="table caption-top">
                <blockquote class="blockquote">
                  <small class="text-muted">訂購人資訊</small>
                </blockquote>
                <tr>
                  <th scope="row">姓 名: {{ memberData.membername }}</th>
                  <td></td>
                </tr>
                <tr>
                  <th scope="row">電 話: {{ memberData.memberphoneno }}</th>
                  <td></td>
                </tr>
                <tr>
                  <th scope="row">信 箱: {{ memberData.memberemail }}</th>
                  <td></td>
                </tr>
              </div>
              <!-- 付款方式 start -->

              <div>
                <blockquote class="blockquote">
                  <small class="text-muted">付款方式</small>
                </blockquote>

                <img
                  src="../assets/index/other/ECPay.png"
                  style="width: 200px; height: auto"
                />
              </div>

              <!-- 付款方式 end -->
            </div>
          </div>
          <!-- 訂購人資訊 end -->
        </div>
        <!-- 結帳 -->
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
                <button
                  @click="postOrderDataToServerAndThirdPartyPayment()"
                  class="btn btn-primary"
                >
                  結帳
                </button>
              </div>
            </div>
          </div>
          <!-- back -->
          <div class="row justify-content-center">
            <router-link class="col-8 my-4 text-center" to="/checkout">
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
import axios from "axios";
import { ref, onMounted, computed } from "vue";
import { useCartStore, useCouponStore } from "../stores/courseStore.js";
import { storeToRefs } from "pinia";
import { useNow, useDateFormat } from "@vueuse/core";
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
  Order
*/
// 根據你的資料結構組合需要的資料
const courseCart = courseCartStore.value; // 獲取courseCart數組
const couponId = courseCouponStore.value.couponId;

const dataToSend = {
  orderDate: "",
  // orderCondition: "未成立", // default
  orderCondition: "未付款", // default
  memberId: localStorage.getItem("memberid"),
  orderTotalAmount: "", // for (課程-折扣)
  orderPaymentMethod: "Credit Card", // default
  orderstate: 1, // default
  // orderItem: courseCart.map((classId) => ({ classId, couponId })), // 使用map轉換courseCart數組
  orderItem: [], // 使用map轉換courseCart數組
};

const memberId = localStorage.getItem("memberid");
const memberData = ref({});

const generateOrderItem = () => {
  dataToSend.orderItem.push({ classId: courseCart[0], couponId: couponId });
  for (let i = 1; i < courseCart.length; i++) {
    dataToSend.orderItem.push({ classId: courseCart[i], couponId: null });
  }
};

const fetchMemberData = async () => {
  try {
    const id = memberId;
    // console.log(id);
    const response = await axios.get(`${URL}/members/${id}`);
    memberData.value = response.data;
    // console.log(memberData.value);
  } catch (error) {
    console.error("獲取會員資料失敗", error);
  }
};

const postOrderDataToServerAndThirdPartyPayment = async () => {
  try {
    // 時間為訂單成立時間,使用 vueuse 套件生成
    const formatted = useDateFormat(useNow(), "YYYY/MM/DD HH:mm:ss");
    console.log(formatted.value);
    generateOrderItem();
    // 生成後將值，塞給dataToSend.orderDate
    dataToSend.orderDate = formatted.value;

    // 訂單總金額 = 商品總額-折扣的金額
    dataToSend.orderTotalAmount =
      totalPrice.value - courseCouponStore.value.couponDiscount;
    console.log(dataToSend.orderTotalAmount);

    // 發送 POST 請求到後端 API
    const response = await axios.post(`${URL}/orders`, dataToSend);
    console.log(response.data);
    // 建立傳送給綠界的物件
    // 並把新增order的response傳給ecpayorderitem
    const responseData = response.data;
    const ecpayorderitem = {
      orderId: responseData.orderId,
      orderdate: responseData.orderDate,
      orderamount: responseData.orderTotalAmount,
    };
    console.log(ecpayorderitem);

    if (response.status === 200) {
      // ecpay請求 會回傳字串form表單
      const ecpayResponse = await axios.post(
        `${URL}/ecpay/ecpayCheckoutOrder`,
        ecpayorderitem
      );
      const ecpayCheckout = ecpayResponse.data;
      console.log(ecpayCheckout);

      // 建立一個隱藏的 div 元素，將表單內容放入
      const hiddenDiv = document.createElement("div");
      hiddenDiv.style.display = "none"; // Hide div element
      hiddenDiv.innerHTML = ecpayCheckout;

      // 將隱藏的 div 添加到網頁中
      document.body.appendChild(hiddenDiv);
      // 找到表單元素
      const form = hiddenDiv.querySelector("form");
      if (form) {
        // 觸發表單自動提交
        form.submit();
      } else {
        console.error("form element not found");
      }
      updateCouponDataToDB();
    } else {
      // 其他狀態碼，可能需要進行錯誤處理
      console.error("Request failed, status code:", response.status);
    }
  } catch (error) {
    console.error("發生錯誤", error);
  }
  courseCartStore.value = []; // Clear the cart
};

const updateCouponDataToDB = async () => {
  if (courseCouponStore.value.couponCode) {
    try {
      // update couponUsed amount
      const couponUsed = ref(parseInt(courseCouponStore.value.couponUsed) || 0);
      couponUsed.value += 1;
      console.log("Coupon 使用量 " + couponUsed.value);
      const response = await axios.put(
        `${URL}/coupons/update/${courseCouponStore.value.couponId}`,
        null,
        {
          params: {
            couponused: couponUsed.value.toString(), // 将值作为请求参数发送
          },
        }
      );

      // backend response data
      console.log("Backend response data", response.data);
    } catch (error) {
      console.error("error when update coupon data to DB", error);
    }
  }
};

/*
  Load classes datas
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
  fetchMemberData();
});
</script>

<style scoped>
.text-danger {
  font-size: 8px;
}

.btn-primary {
  --bs-btn-color: #fff;
  --bs-btn-bg: #ffc408;
  --bs-btn-border-color: #fff;
  --bs-btn-hover-bg: #e83015;
  --bs-btn-hover-border-color: #c34e2e;
  --bs-btn-active-bg: #c34e2e;
}
</style>
