import Swal from "sweetalert2";

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

export const showGameOverPopup = (restart: () => void): void => {
  Swal.fire({
    title: "⏰ 时间到! ⏰",
    html: `
			<div style="text-align: center;">
				<h2 style="color: #d32f2f; margin-bottom: 20px;">游戏失败</h2>
				<p style="color: #666; font-size: 16px;">
					时间已耗尽，请再接再厉！
				</p>
			</div>
		`,
    icon: "error",
    showCancelButton: true,
    confirmButtonText: "重新开始",
    cancelButtonText: "关闭",
    confirmButtonColor: "#2d5a27",
    cancelButtonColor: "#6c757d",
    showCloseButton: true,
    allowOutsideClick: false,
  }).then((result) => {
    if (result.isConfirmed) {
      restart();
    }
  });
};

export const showTimedModeWinPopup = (
  remainingTime: number,
  restart: () => void,
): void => {
  const minutes = Math.floor(remainingTime / 60);
  const seconds = remainingTime % 60;
  Swal.fire({
    title: "🎉 恭喜通关! 🎉",
    html: `
			<div style="text-align: center;">
				<h2 style="color: #2d5a27; margin-bottom: 20px;">限时挑战模式胜利!</h2>
				<p style="color: #4a7c59; font-size: 18px; margin-bottom: 15px;">
					你在剩余时间内完成了游戏！
				</p>
				<div style="font-size: 24px; margin: 20px 0;">
					⏱️ 剩余时间: ${minutes}:${seconds.toString().padStart(2, "0")}
				</div>
				<p style="color: #666; font-size: 14px;">
					准备好接受下一个挑战了吗？
				</p>
			</div>
		`,
    icon: "success",
    showCancelButton: true,
    confirmButtonText: "再玩一次",
    cancelButtonText: "关闭",
    confirmButtonColor: "#2d5a27",
    cancelButtonColor: "#6c757d",
    showCloseButton: true,
    allowOutsideClick: false,
  }).then((result) => {
    if (result.isConfirmed) {
      restart();
    }
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

export const showWonPopup = (restart: () => void): void => {
  Swal.fire({
    title: "🎉 Congratulations! 🎉",
    html: `
			<div style="text-align: center;">
				<h2 style="color: #2d5a27; margin-bottom: 20px;">You Won!</h2>
				<p style="color: #4a7c59; font-size: 18px; margin-bottom: 15px;">
					You've successfully completed all 8 sets!
				</p>
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
