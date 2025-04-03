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
        dateInput.value = "";
    }

    function updateAvailableTimes() {
        timeSelect.innerHTML = "";
        const selectedDate = dateInput.value;

        if (!selectedDate) return;

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
        fetch('https://franciscobarbearia.netlify.app/.netlify/functions/appointments')
            .then(response => response.json())
            .then(data => {
                if (Array.isArray(data)) {
                    reservedTimes = data.map(appointment => ({
                        client_name: appointment.client_name,
                        time: appointment.time,
                        date: appointment.date,
                        whatsapp: appointment.whatsapp
                    }));
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

        if (!name || !whatsapp || !selectedService) {
            alert("Preencha todos os campos corretamente.");
            return;
        }

        const userHasBooking = reservedTimes.some(reserved => 
            reserved.client_name === name && formatDate(reserved.date) === selectedDate
        );

        if (userHasBooking) {
            Swal.fire({
                title: 'Você já tem um agendamento!',
                text: 'Deseja cancelar o agendamento atual?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Sim, cancelar',
                cancelButtonText: 'Não'
            }).then((result) => {
                if (result.isConfirmed) {
                    cancelAppointment(name, selectedDate);
                }
            });
            return;
        }

        Swal.fire({
            title: 'Confirme seu agendamento',
            html: `
                <p><strong>Nome:</strong> ${name}</p>
                <p><strong>Data:</strong> ${selectedDate}</p>
                <p><strong>Horário:</strong> ${selectedTime}</p>
                <p><strong>WhatsApp:</strong> ${whatsapp}</p>
                <p><strong>Serviço:</strong> ${selectedService}</p>
                <p>Deseja confirmar este agendamento?</p>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sim, confirmar!',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
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
                        Swal.fire('Sucesso!', 'Agendamento confirmado.', 'success');
                        reservedTimes.push({ time: selectedTime, date: selectedDate, client_name: name });
                        updateAvailableTimes();
                        fetchReservedTimes();
                    } else {
                        Swal.fire('Erro!', data.error || 'Erro ao agendar.', 'error');
                    }
                })
                .catch(() => Swal.fire('Erro!', 'Erro ao processar a reserva.', 'error'));
            }
        });
    });

    function cancelAppointment(name, date) {
        fetch(`https://franciscobarbearia.netlify.app/.netlify/functions/appointments?client_name=${name}&date=${date}`, {
            method: 'DELETE',
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                Swal.fire('Cancelado!', 'Seu agendamento foi cancelado.', 'success');
                reservedTimes = reservedTimes.filter(appt => appt.client_name !== name || formatDate(appt.date) !== date);
                updateAvailableTimes();
                fetchReservedTimes();
            } else {
                Swal.fire('Erro!', data.error || 'Erro ao cancelar.', 'error');
            }
        })
        .catch(() => Swal.fire('Erro!', 'Erro ao processar o cancelamento.', 'error'));
    }

    setAvailableDates();
    fetchReservedTimes();
});
