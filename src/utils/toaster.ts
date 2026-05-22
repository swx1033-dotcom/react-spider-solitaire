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

export const showWonPopup = (restart: () => void, remainingTime?: number): void => {
  const remainingTimeText = remainingTime 
    ? `<p style="color: #4a7c59; font-size: 16px; margin-bottom: 10px;">
        Remaining Time: ${Math.floor(remainingTime / 60)}:${(remainingTime % 60).toString().padStart(2, '0')}
       </p>` 
    : '';
    
  Swal.fire({
    title: "🎉 Congratulations! 🎉",
    html: `
			<div style="text-align: center;">
				<h2 style="color: #2d5a27; margin-bottom: 20px;">You Won!</h2>
				<p style="color: #4a7c59; font-size: 18px; margin-bottom: 15px;">
					You've successfully completed all 8 sets!
				</p>
        ${remainingTimeText}
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

export const showTimeoutPopup = (restart: () => void): void => {
  Swal.fire({
    title: "⏰ Time's Up! ⏰",
    html: `
			<div style="text-align: center;">
				<h2 style="color: #d32f2f; margin-bottom: 20px;">Game Over!</h2>
				<p style="color: #e53935; font-size: 18px; margin-bottom: 15px;">
					You didn't complete the game in time.
				</p>
				<div style="font-size: 24px; margin: 20px 0;">
					⏰ ⏰ ⏰
				</div>
				<p style="color: #666; font-size: 14px;">
					Want to try again?
				</p>
			</div>
		`,
    icon: "error",
    showCancelButton: true,
    confirmButtonText: "Try Again",
    cancelButtonText: "Close",
    confirmButtonColor: "#d32f2f",
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
