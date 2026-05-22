import Swal from "sweetalert2";

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
};

export const showError = (message: string = "Invalid Operation!"): void => {
  Swal.fire({
    icon: "error",
    text: message,
    toast: true,
    position: "bottom-end",
    timer: 3000,
    showConfirmButton: false,
    timerProgressBar: true,
  });
};

export const showInfo = (message: string): void => {
  Swal.fire({
    icon: "info",
    text: message,
    toast: true,
    position: "bottom-end",
    timer: 4000,
    showConfirmButton: false,
    timerProgressBar: true,
  });
};

export const showWonPopup = (
  restart: () => void,
  remainingSeconds?: number,
): void => {
  const remainingTimeHtml =
    typeof remainingSeconds === "number"
      ? `
        <p style="color: #2d5a27; font-size: 18px; margin-bottom: 15px;">
          剩余时间：${formatTime(remainingSeconds)}
        </p>
      `
      : "";

  Swal.fire({
    title: "🎉 Congratulations! 🎉",
    html: `
			<div style="text-align: center;">
				<h2 style="color: #2d5a27; margin-bottom: 20px;">You Won!</h2>
				<p style="color: #4a7c59; font-size: 18px; margin-bottom: 15px;">
					You've successfully completed all 8 sets!
				</p>
        ${remainingTimeHtml}
				<div style="font-size: 24px; margin: 20px 0;">
					🃏 🃏 🃏 🃏 🃏 🃏 🃏 🃏
				</div>
				<p style="color: #666; font-size: 14px;">
					Ready for another challenge?
				</p>
			</div>
		`,
    icon: "success",
    showCancelButton: true,
    confirmButtonText: "Play Again",
    cancelButtonText: "Close",
    confirmButtonColor: "#2d5a27",
    cancelButtonColor: "#6c757d",
    showCloseButton: true,
    allowOutsideClick: false,
    customClass: {
      popup: "swal2-custom-popup",
      title: "swal2-custom-title",
      htmlContainer: "swal2-custom-html",
    },
  }).then((result) => {
    if (result.isConfirmed) {
      restart();
    }
  });
};

export const showLostPopup = (restart: () => void): void => {
  Swal.fire({
    title: "时间到",
    html: `
      <div style="text-align: center;">
        <h2 style="color: #8b1e1e; margin-bottom: 20px;">游戏失败</h2>
        <p style="color: #666; font-size: 18px; margin-bottom: 15px;">
          倒计时已归零，本局挑战结束。
        </p>
      </div>
    `,
    icon: "error",
    showCancelButton: true,
    confirmButtonText: "重新开始",
    cancelButtonText: "关闭",
    confirmButtonColor: "#8b1e1e",
    cancelButtonColor: "#6c757d",
    showCloseButton: true,
    allowOutsideClick: false,
    customClass: {
      popup: "swal2-custom-popup",
      title: "swal2-custom-title",
      htmlContainer: "swal2-custom-html",
    },
  }).then((result) => {
    if (result.isConfirmed) {
      restart();
    }
  });
};
