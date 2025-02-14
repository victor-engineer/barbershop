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

            // Verifica se o horário está reservado para a data selecionada
            const isReserved = reservedTimes.some(reserved => 
                reserved.time === time && formatDate(reserved.date) === selectedDate
            );

            if (isReserved) {
                option.textContent = `${time} - Indisponível`;
                option.disabled = true; // Desabilita o horário reservado
            } else {
                option.textContent = time;
            }

            timeSelect.appendChild(option);
        });
    }

    function fetchReservedTimes() {
        // Carrega os horários reservados da API
        fetch('https://franciscobarbearia.netlify.app/.netlify/functions/appointments')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    reservedTimes = data.appointments.map(appointment => ({
                        time: appointment.time,
                        date: appointment.date
                    }));
                    updateAvailableTimes(); // Atualiza a interface com os horários reservados
                } else {
                    console.error('Erro ao carregar horários:', data.error);
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

        // Envia a reserva para a API para persistir os dados
        fetch('https://franciscobarbearia.netlify.app/.netlify/functions/appointments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(appointmentData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Reserva feita com sucesso');

                // Adiciona o horário à lista de horários reservados localmente
                reservedTimes.push({
                    time: selectedTime,
                    date: selectedDate
                });

                updateAvailableTimes(); // Atualiza a interface de horários imediatamente

                fetchReservedTimes(); // Recarrega os horários reservados da API para garantir consistência
            } else {
                alert(data.error || 'Erro ao agendar a reserva');
            }
        })
        .catch(error => alert("Erro ao processar a reserva."));
    });

    setAvailableDates();
    fetchReservedTimes(); // Carrega os horários reservados quando a página for carregada
});
