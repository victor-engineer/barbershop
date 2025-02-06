document.addEventListener("DOMContentLoaded", () => {
    const bookingForm = document.getElementById("booking-form");
    const nameInput = document.getElementById("client_name");
    const dateInput = document.getElementById("date");
    const timeSelect = document.getElementById("time");

    // Horários disponíveis
    const workingHours = [
        "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00",
        "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
        "18:00", "18:30"
    ];

    let reservedTimes = [];

    function formatTime(time) {
        const [hour, minute] = time.split(':');
        return `${hour}:${minute}`;
    }

    function formatDate(date) {
        const localDate = new Date(date);
        return localDate.toISOString().split("T")[0];
    }

    function setAvailableDates() {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        const todayFormatted = formatDate(today);
        const tomorrowFormatted = formatDate(tomorrow);

        dateInput.setAttribute("min", todayFormatted);
        dateInput.setAttribute("max", tomorrowFormatted);
        dateInput.value = todayFormatted;
    }

    function isTimeReserved(selectedTime, selectedDate) {
        return reservedTimes.some(
            (reserved) => reserved.time === selectedTime && formatDate(reserved.date) === selectedDate
        );
    }

    function updateAvailableTimes() {
        timeSelect.innerHTML = "";
        const selectedDate = dateInput.value;

        workingHours.forEach((time) => {
            const option = document.createElement("option");
            option.value = time;

            const reservedAppointment = reservedTimes.find(reserved => reserved.time === time && formatDate(reserved.date) === selectedDate);

            if (reservedAppointment) {
                option.textContent = `${time} - Indisponível`;
                option.disabled = true;
            } else {
                option.textContent = time;
            }

            timeSelect.appendChild(option);
        });
    }

    function fetchReservedTimes() {
        fetch('https://franciscobarbearia.netlify.app/.netlify/functions/appointments-ui')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    reservedTimes = data.appointments.map(appointment => ({
                        time: formatTime(appointment.time),
                        date: appointment.date,
                        client_name: appointment.client_name
                    }));
                    updateAvailableTimes();
                } else {
                    console.error('Erro ao carregar horários reservados', data.error);
                }
            })
            .catch(error => {
                console.error('Erro ao buscar horários reservados:', error);
            });
    }

    bookingForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const name = nameInput.value.trim();
        const selectedDate = dateInput.value;
        const selectedTime = timeSelect.value;

        if (!name) {
            alert("Por favor, insira seu nome.");
            return;
        }

        if (isTimeReserved(selectedTime, selectedDate)) {
            alert(`O horário ${selectedTime} já está reservado para o dia ${selectedDate}. Escolha outro horário.`);
            return;
        }

        reservedTimes.push({
            client_name: name,
            date: selectedDate,
            time: selectedTime
        });

        updateAvailableTimes();

        const appointmentData = {
            client_name: name,
            date: selectedDate,
            time: selectedTime
        };

        fetch('https://franciscobarbearia.netlify.app/.netlify/functions/appointments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(appointmentData)
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erro na resposta do servidor: ${response.status} - ${response.statusText}`);
                }
                return response.text();
            })
            .then(text => {
                let data;
                try {
                    data = JSON.parse(text);
                } catch (error) {
                    console.error("Erro ao tentar parsear o JSON:", error);
                    alert("Erro inesperado ao processar a resposta.");
                    return;
                }

                if (data.success) {
                    alert('Reserva feita com sucesso');
                    fetchReservedTimes();
                } else {
                    alert(data.error || 'Erro ao agendar a reserva');
                }
            })
            .catch(error => {
                console.error('Erro ao enviar os dados:', error);
                alert("Horário Já Reservado. Tente Outro Horário.");
            });
    });

    setAvailableDates();
    fetchReservedTimes();
});
