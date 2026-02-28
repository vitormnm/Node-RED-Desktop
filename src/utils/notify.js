import { reactive } from "vue";

export const notify = reactive({
  show: false,
  color: "info",
  message: "",

  success(msg) {
    this.message = msg;
    this.color = "success";
    this.show = true;
  },

  error(msg) {
    this.message = msg;
    this.color = "error";
    this.show = true;
  },

  warning(msg) {
    this.message = msg;
    this.color = "warning";
    this.show = true;
  },

  info(msg) {
    this.message = msg;
    this.color = "info";
    this.show = true;
  }
});
