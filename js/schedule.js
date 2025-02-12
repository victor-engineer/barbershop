document.addEventListener("DOMContentLoaded", () => {
    const bookingForm = document.getElementById("booking-form");
    const nameInput = document.getElementById("client_name");
    const dateInput = document.getElementById("date");
    const timeSelect = document.getElementById("time");
    const whatsappInput = document.getElementById("whatsapp"); // Campo de WhatsApp
    const serviceSelect = document.getElementById("service"); // Novo campo de serviço

    const workingHours = [
        "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00",
        "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
        "18:00", "18:30"
    ];

    let reservedTimes = [];

    function formatDate(date) {
        return new Date(date).toISOString().split("T")[0];
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

            const isReserved = reservedTimes.some(reserved => reserved.time === time && formatDate(reserved.date) === selectedDate);

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
        fetch('https://franciscobarbearia.netlify.app/.netlify/functions/appointments')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    reservedTimes = data.appointments.map(appointment => ({
                        time: appointment.time,
                        date: appointment.date
                    }));
                    updateAvailableTimes();
                }
            })
            .catch(error => console.error('Erro ao buscar horários reservados:', error));
    }

    bookingForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const name = nameInput.value.trim();
        const selectedDate = dateInput.value;
        const selectedTime = timeSelect.value;
        const whatsapp = whatsappInput.value.trim(); // Obtendo o valor do WhatsApp
        const selectedService = serviceSelect.value; // Captura o serviço selecionado

        // Validando os campos
        if (!name) {
            alert("Por favor, insira seu nome.");
            return;
        }

        // Validação do campo WhatsApp com uma expressão regular
        const whatsappRegex = /^(\+?\d{1,4}[\s\-]?)?(\(?\d{2,3}\)?[\s\-]?)?[\d\s\-]{7,13}$/;
        if (!whatsapp || !whatsappRegex.test(whatsapp)) {
            alert("Por favor, insira um número de WhatsApp válido.");
            return;
        }

        // Validando o campo de serviço
        if (!selectedService) {
            alert("Por favor, selecione um serviço.");
            return;
        }

        const isTimeReserved = reservedTimes.some(reserved => reserved.time === selectedTime && formatDate(reserved.date) === selectedDate);

        if (isTimeReserved) {
            alert(`O horário ${selectedTime} já está reservado. Escolha outro.`);
            return;
        }

        const appointmentData = { 
            client_name: name, 
            date: selectedDate, 
            time: selectedTime,
            whatsapp: whatsapp, // Incluindo o número de WhatsApp
            service: selectedService // Incluindo o serviço
        };

        fetch('https://franciscobarbearia.netlify.app/.netlify/functions/appointments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(appointmentData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Reserva feita com sucesso');
                // Atualiza os horários reservados após a reserva
                reservedTimes.push({ time: selectedTime, date: selectedDate });
                updateAvailableTimes();
            } else {
                alert(data.error || 'Erro ao agendar a reserva');
            }
        })
        .catch(error => alert("Erro ao processar a reserva."));
    });

    setAvailableDates();
    fetchReservedTimes();
});
