document.addEventListener("DOMContentLoaded", () => {
    const bookingForm = document.getElementById("booking-form");
    const nameInput = document.getElementById("client_name");
    const dateInput = document.getElementById("date");
    const timeSelect = document.getElementById("time");
    const whatsappInput = document.getElementById("whatsapp");
    const serviceSelect = document.getElementById("service");

    const workingHours = [
        "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00",
        "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
        "18:00", "18:30"
    ];

    let reservedTimes = [];

    function formatDate(date) {
        return new Date(date).toISOString().split("T")[0];
    }

    function formatTime(time) {
        return time.split(":").slice(0, 2).join(":");
    }

    function setAvailableDates() {
        const today = new Date();
        dateInput.setAttribute("min", formatDate(today));
        dateInput.value = formatDate(today);
    }

    function updateAvailableTimes() {
        timeSelect.innerHTML = "";
        const selectedDate = dateInput.value;

        workingHours.forEach((time) => {
            const option = document.createElement("option");
            option.value = time;

            const isReserved = reservedTimes.some(reserved => 
                formatTime(reserved.time) === time && formatDate(reserved.date) === selectedDate
            );

            if (isReserved) {
                option.textContent = `${time} - Indisponível`;
                option.disabled = true;
            } else {
                option.textContent = time;
            }

            timeSelect.appendChild(option);
        });
    }

    function fetchReservedTimes() {
        console.log("Buscando horários reservados...");
        fetch('https://franciscobarbearia.netlify.app/.netlify/functions/appointments')
            .then(response => response.json())
            .then(data => {
                console.log("Resposta da API:", data);
                if (Array.isArray(data)) {
                    reservedTimes = data.map(appointment => ({
                        time: appointment.time,
                        date: appointment.date
                    }));
                    console.log("Horários reservados:", reservedTimes);
                    updateAvailableTimes();
                } else {
                    console.error('Erro: Esperado um array de reservas', data);
                }
            })
            .catch(error => console.error('Erro ao buscar horários reservados:', error));
    }

    dateInput.addEventListener("change", updateAvailableTimes);

    bookingForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const name = nameInput.value.trim();
        const selectedDate = dateInput.value;
        const selectedTime = timeSelect.value;
        const whatsapp = whatsappInput.value.trim();
        const selectedService = serviceSelect.value;

        if (!name) {
            alert("Por favor, insira seu nome.");
            return;
        }

        const whatsappRegex = /^(\+?\d{1,4}[\s\-]?)?(\(?\d{2,3}\)?[\s\-]?)?[\d\s\-]{7,13}$/;
        if (!whatsapp || !whatsappRegex.test(whatsapp)) {
            alert("Por favor, insira um número de WhatsApp válido.");
            return;
        }

        if (!selectedService) {
            alert("Por favor, selecione um serviço.");
            return;
        }

        const isTimeReserved = reservedTimes.some(reserved => 
            reserved.time === selectedTime && formatDate(reserved.date) === selectedDate
        );

        if (isTimeReserved) {
            alert(`O horário ${selectedTime} já está reservado. Escolha outro.`);
            return;
        }

        const appointmentData = { 
            client_name: name, 
            date: selectedDate, 
            time: selectedTime,
            whatsapp: whatsapp,
            service: selectedService
        };

        fetch('https://franciscobarbearia.netlify.app/.netlify/functions/appointments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(appointmentData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                Swal.fire({
                    title: 'Sucesso!',
                    text: 'Reserva feita com sucesso.',
                    icon: 'success',
                    confirmButtonText: 'Ok',
                    timer: 3000,
                    timerProgressBar: true
                });

                reservedTimes.push({
                    time: selectedTime,
                    date: selectedDate
                });

                updateAvailableTimes();
                fetchReservedTimes();
            } else {
                Swal.fire({
                    title: 'Erro!',
                    text: data.error || 'Erro ao agendar a reserva.',
                    icon: 'error',
                    confirmButtonText: 'Tentar novamente'
                });
            }
        })
        .catch(error => {
            Swal.fire({
                title: 'Erro!',
                text: 'Erro ao processar a reserva.',
                icon: 'error',
                confirmButtonText: 'Ok'
            });
        });
    });

    // 🔴 Essas linhas estavam dentro do addEventListener de submit, mas devem ser chamadas ao carregar a página:
    setAvailableDates();
    fetchReservedTimes();
});
