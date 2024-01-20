<template>
  <Carousel></Carousel>
  <!-- singlePage -->
  <div class="container">
    <section class="page-section" id="courseDetail">
      <div class="row justify-content-center">
        <h1 class="col-12 text-center">{{ pageCourse.courseName }}課程</h1>
        <div class="card col-12 col-md-11 col-lg-10 h-100 mb-4">
          <div class="row justify-content-center align-items-center">
            <div class="col-5 mx-3">
              <img
                v-show="loadImgFactor"
                :src="`${URL}/course/getImg?cid=${route.params['courseid']}`"
                class="card-img mt-3"
                alt="not Found"
                @load="loadImg"
              />
              <n-space v-if="!loadImgFactor" justify="center" Align="center">
                <n-spin size="large" stroke="#ffc408" />
              </n-space>
            </div>
            <div class="col-6 mx-3">
              <div class="my-3">
                <div class="row align-items-center">
                  <div class="rol">
                    <div>課程時間:</div>
                  </div>
                  <div>
                    <span>{{ displayClasses.classDate }}</span
                    >&nbsp;&nbsp;
                    <span>{{ displayClasses.classTime }}</span>
                  </div>
                </div>
              </div>

              <div class="my-3">
                <div>授課教練:&nbsp;{{ displayClasses.employeename }}</div>
              </div>

              <div class="my-3">
                <div>地點:&nbsp;{{ displayClasses.classroomName }}</div>
              </div>

              <div class="my-3">
                <div>
                  價格:&nbsp;NT$&nbsp;{{
                    displayClasses.price.toLocaleString()
                  }}
                </div>
              </div>

              <div class="ml-2 my-3">
                <div>課程說明:</div>
                <p class="fs-6">
                  {{ pageCourse.courseDescription }}
                </p>
              </div>

              <div class="ml-2 my-3">
                <div
                  v-if="
                    displayClasses.alreadyBuyAmount != undefined &&
                    displayClasses.applicantsCeil <
                      displayClasses.alreadyBuyAmount
                  "
                >
                  剩餘名額:&nbsp;0
                </div>
                <div v-else-if="displayClasses.alreadyBuyAmount != undefined">
                  剩餘名額:&nbsp;{{
                    displayClasses.applicantsCeil -
                    displayClasses.alreadyBuyAmount
                  }}
                </div>
                <div v-else>
                  剩餘名額:&nbsp;{{ displayClasses.applicantsCeil }}
                </div>
              </div>

              <div class="ml-2 my-3">
                <div
                  v-if="displayClasses.isMemberaAlreadyBuy"
                  style="color: red; font-size: medium"
                >
                  您已經購買過本課程囉!
                </div>
              </div>

              <div class="row justify-content-end my-4">
                <div class="col-12 col-md-6 col-lg-4">
                  <button
                    class="btn btn btn-primary mx-2"
                    @click="addToWishlist(displayClasses.classId)"
                  >
                    <i type="button" class="bi bi-heart-fill"></i
                    >&nbsp;&nbsp;加入願望清單
                  </button>
                </div>
                <div class="col-12 col-md-6 col-lg-4">
                  <button
                    class="btn btn btn-primary mx-2"
                    @click="saveCourseCartToLocalStorage('stay')"
                  >
                    <i type="button" class="bi bi-cart4"></i
                    >&nbsp;&nbsp;加入購物車
                  </button>
                </div>
                <div class="col-12 col-md-6 col-lg-4">
                  <button
                    class="btn btn btn-primary mx-2"
                    @click="saveCourseCartToLocalStorage('forward')"
                  >
                    <i type="button" class="bi bi-cart3"></i
                    >&nbsp;&nbsp;直接購買
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <hr />

      <div class="row justify-content-center">
        <div class="col-12 col-md-10 col-lg-10">
          <FullCalendar
            :courseName="pageCourse.courseName"
            :calendarEvents="calendarEvents"
            @click-calendar-class-emit="onClickedClass"
          ></FullCalendar>
        </div>
      </div>

      <hr />

      <div class="row justify-content-center">
        <div class="col-12 col-md-10 col-lg-10">
          <h2 class="text-center">推薦課程</h2>
          <div
            class="row row-cols-1 row-cols-md-3 row-cols-lg-4 g-4 justify-content-center"
          >
            <courseCard
              v-for="(course, index) in recommendedCourses"
              class="col-3 mx-2 my-3"
              :cardAmount="index"
              :course="course"
              :URL="URL"
            >
            </courseCard>
          </div>
        </div>
      </div>
    </section>
  </div>

  <CartIcon></CartIcon>
</template>

<script setup>
/*
  imports
*/

import { ref, reactive, onMounted, watch } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import axios from "axios";
import { useDialog, useMessage, NSpace, NSpin } from "naive-ui";
import courseCard from "../components/course/courseCard.vue";
import FullCalendar from "../components/course/courseCalendar.vue";
import CartIcon from "../components/course/util/icon-cart.vue";
import { vFocus } from "../directives/vFocus";
import { useCartStore, useWishlistStore } from "../stores/courseStore.js";
import { storeToRefs } from "pinia";
import Carousel from "../components/Carousel.vue";
const URL = import.meta.env.VITE_API_JAVAURL;

/*
  router
*/
const route = useRoute();
const router = useRouter();

/*
  watcher for router
*/

// const pageCourseId = ref(route.params["courseid"]);
watch(
  () => route.params["courseid"],

  async (newUrlCourseId) => {
    if (newUrlCourseId != undefined) {
      // console.log(newUrlCourseId);
      await loadPageCourse();
      await loadPageClasses();
    }
  }
);

/*
  Store and relative responsive datas and local storage
*/
const cartStore = useCartStore();
const { courseCartStore } = storeToRefs(cartStore);
const wishlistStore = useWishlistStore();
const { courseWishlistStore } = storeToRefs(wishlistStore);

/*
  Display Data
*/
const displayClasses = reactive({
  classId: 0,
  classDate: "",
  classTime: "",
  employeename: "",
  classroomName: "",
  price: "",
  applicantsCeil: "",
  alreadyBuyAmount: "",
  isMemberaAlreadyBuy: false,
});

/*
  Calendar
*/
const calendarEvents = ref([]);

/*
Load datas
*/

// Load single course data
const pageCourse = ref([]);
const loadPageCourse = async () => {
  const URLAPI = `${URL}/course/${route.params["courseid"]}`;
  const response = await axios.get(URLAPI).catch((error) => {
    console.log(error.toJSON());
  });
  pageCourse.value = response.data;
  // console.log(pageCourse);
};

// Load Classes data
const pageClasses = ref([]);
const loadPageClasses = async () => {
  const URLAPI = `${URL}/classes/findAllClassesInMonthRange/${route.params["courseid"]}`;
  const response = await axios
    .get(URLAPI, {
      params: {
        monthBefore: -1, // monthBefore=-1 means the start day will be the first day of next month
        monthAfter: 1,
      },
    })
    .catch((error) => {
      console.log(error.toJSON());
    });
  // console.log(response.data);

  pageClasses.value = response.data;
  // console.log(pageClasses);

  const resAlreadyBuy = await getAlreadyBuy(pageClasses.value[0]["classId"]);

  // imitial diaplay data
  if (pageClasses.value.length != 0) {
    displayClasses.classId = pageClasses.value[0]["classId"];
    displayClasses.classDate = pageClasses.value[0]["classDate"];
    displayClasses.classTime = pageClasses.value[0]["classTime"];
    displayClasses.employeename = pageClasses.value[0]["employeename"];
    displayClasses.classroomName = pageClasses.value[0]["classroomName"];
    displayClasses.price = pageClasses.value[0]["price"];
    displayClasses.applicantsCeil = pageClasses.value[0]["applicantsCeil"];
    displayClasses.alreadyBuyAmount = resAlreadyBuy.data["orderAmount"];
  }

  // put all classes data in calendar
  calendarEvents.value = pageClasses.value.map((item) => {
    return {
      id: item["classId"],
      title: item["classTime"],
      start: item["classDate"],
    };
  });

  if (localStorage.getItem("memberid") != "") {
    // 取得該會員是否購買過課程
    await getMemberAlreadyBuy(pageClasses.value[0]["classId"]);
    if (Object.keys(memberAlreadyBuy.value).length != 0) {
      displayClasses.isMemberaAlreadyBuy = true;
    } else {
      displayClasses.isMemberaAlreadyBuy = false;
    }
  }
};

// Load wishlist classes data
const pageWishlistClasses = ref([]);
const loadPageWishlistClasses = async () => {
  // console.log(courseWishlistStore.value);
  if (localStorage.getItem("memberid") != "") {
    // check login or not
    const URLAPI = `${URL}/classes/findAllClassesInMemberWishlist`;
    const response = await axios
      .get(URLAPI, {
        params: {
          memberId: localStorage.getItem("memberid"),
        },
      })
      .catch((error) => {
        console.log(error.toJSON());
      });
    // console.log(response);

    pageWishlistClasses.value = response.data;
    // console.log(pageClasses);
    updateWishlistDBtoStore(pageWishlistClasses);
  }
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

// Load recommended courses data
const recommendedCourses = ref([]);
const loadRecommendedCourses = async () => {
  const URLAPI = `${URL}/course/page`;
  const response = await axios
    .get(URLAPI, {
      params: {
        p: Math.floor(Math.random() * 5) + 1, // 隨機產生1~5正整數
        size: 3,
      },
    })
    .catch((error) => {
      console.log(error.toJSON());
    });

  //取得所有課程放進courses變數
  recommendedCourses.value = response.data;
};

/*
  Methods for Verification
*/
const memberAlreadyBuy = ref([]);
const getMemberAlreadyBuy = async (classId) => {
  const URLAPIMEMBERBUY = `${URL}/orders/getAlreadyBuy`;
  const response = await axios
    .get(URLAPIMEMBERBUY, {
      params: {
        classId: classId,
        memberId: localStorage.getItem("memberid"),
      },
    })
    .catch((error) => {
      console.log(error.toJSON());
    });
  memberAlreadyBuy.value = response.data;
};

/*
  Event obj. method
*/

const onClickedClass = async (classId) => {
  // console.log("get emit: " + classId);

  // update diaplay data
  let clickedCLass = pageClasses.value.find((item) => {
    return item.classId == classId;
  });

  // 取得該堂課被購買的資訊
  const resAlreadyBuy = await getAlreadyBuy(classId);

  if (localStorage.getItem("memberid") != "") {
    // 取得該會員是否購買過課程
    await getMemberAlreadyBuy(classId);
    if (Object.keys(memberAlreadyBuy.value).length != 0) {
      displayClasses.isMemberaAlreadyBuy = true;
    } else {
      displayClasses.isMemberaAlreadyBuy = false;
    }
  }

  displayClasses.classId = clickedCLass["classId"];
  displayClasses.classDate = clickedCLass["classDate"];
  displayClasses.classTime = clickedCLass["classTime"];
  displayClasses.employeename = clickedCLass["employeename"];
  displayClasses.classroomName = clickedCLass["classroomName"];
  displayClasses.price = clickedCLass["price"];
  displayClasses.applicantsCeil = clickedCLass["applicantsCeil"];
  displayClasses.alreadyBuyAmount = resAlreadyBuy.data["orderAmount"];
};

const saveCourseCartToLocalStorage = async (forwardOrStay) => {
  // soldout verification start
  if (displayClasses.applicantsCeil - displayClasses.alreadyBuyAmount <= 0) {
    handleWarning("可惜了", "很抱歉，課程已經售完囉!");
    return;
  } else {
    const res = await getAlreadyBuy(displayClasses.classId);
    let i = 0;
    for (let classId of courseCartStore.value) {
      const res = await getAlreadyBuy(classId);
      if (res.data["applicantsCeil"] - res.data["orderAmount"] <= 0) {
        handleWarning("可惜了", "很抱歉，課程已經售完囉!");
        deleteCartItem(res.data["classId"]);
        return;
      }
      i++;
    }
  }
  // soldout verification end

  // member already buy verification start
  if (localStorage.getItem("memberid") != "") {
    await getMemberAlreadyBuy(displayClasses.classId);
    if (Object.keys(memberAlreadyBuy.value).length != 0) {
      handleWarning("小提醒", "您已經購買過本課程囉!");
      return;
    }
  }
  // member already buy verification end

  if (
    // check classId have value and not repeat in LocalStorage
    displayClasses.classId != 0 &&
    !courseCartStore.value.includes(displayClasses.classId)
  ) {
    courseCartStore.value.push(displayClasses.classId);
  }
  if (forwardOrStay == "forward") {
    console.log("forward");

    router.push("/cart");
  } else {
    console.log("stay");
  }
};

// Load CourseImg
const loadImgFactor = ref(false);
const loadImg = () => {
  loadImgFactor.value = true;
  console.log("afterloaded");
};

/*
  method for add item to wishlish DB
*/
// add item to wishlish DB
const AddWishlistItemToDB = async (classId) => {
  const resWishlist = await axios
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
const addToWishlist = async (classId) => {
  if (localStorage.getItem("memberid") == "") {
    handleMessage("請先登入會員");
  } else {
    // member already buy verification start
    await getMemberAlreadyBuy(displayClasses.classId);
    if (Object.keys(memberAlreadyBuy.value).length != 0) {
      handleWarning("小提醒", "您已經購買過本課程囉!");
      return;
    }
    // member already buy verification end

    if (!courseWishlistStore.value.includes(classId)) {
      AddWishlistItemToDB(classId);
      courseWishlistStore.value.push(classId);
      // Use Naive UI Dialog
      handleSuccess("課程已成功加入願望清單");
    } else {
      handleMessage("課程已存在您的願望清單");
    }
  }
};

/*
  method for save DB wishlist items in store
*/
const updateWishlistDBtoStore = (pageWishlistClasses) => {
  let wishlistTemp = [];
  for (let i = 0; i < pageWishlistClasses.value.length; i++) {
    wishlistTemp.push(pageWishlistClasses.value[i]["classId"]);
  }
  courseWishlistStore.value = wishlistTemp;
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
const handleWarning = (titleText, contentText) => {
  dialog.warning({
    title: titleText,
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
  loadPageCourse();
  loadPageClasses();
  loadRecommendedCourses();
  loadPageWishlistClasses();
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

p {
  text-align: justify;
  /* padding: 1em; */
  text-indent: 2em;
}

.card-img,
.card-img-top,
.card-img-bottom {
  width: 100%;
  height: 100%;
}
</style>
