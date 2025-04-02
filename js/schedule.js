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
        dateInput.value = ""; // Deixar vazio até o usuário clicar
    }

    function updateAvailableTimes() {
        timeSelect.innerHTML = "";
        const selectedDate = dateInput.value;

        if (!selectedDate) return; // Só mostrar horários se uma data for selecionada

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
        /* function updateAvailableTimes(loggedUserName) {
        timeSelect.innerHTML = "";
        const selectedDate = dateInput.value;

        if (!selectedDate) return; // Só mostrar horários se uma data for selecionada

        workingHours.forEach((time) => {
            const optionContainer = document.createElement("div"); // Criar um container para cada opção
            optionContainer.style.display = "flex";
            optionContainer.style.alignItems = "center";
            optionContainer.style.gap = "10px"; // Espaçamento entre os elementos

            const option = document.createElement("option");
            option.value = time;

            const reservedAppointment = reservedTimes.find(reserved => 
                formatTime(reserved.time) === time && formatDate(reserved.date) === selectedDate
            );

            if (reservedAppointment) {
                option.textContent = `${time} - ${reservedAppointment.client_name}`;
                option.disabled = true;
                
                optionContainer.appendChild(option);

                // Se o usuário logado for o dono da reserva, adiciona o botão de exclusão
                if (loggedUserName === reservedAppointment.client_name) {
                    const deleteButton = document.createElement("button");
                    deleteButton.textContent = "Cancelar";
                    deleteButton.style.backgroundColor = "red";
                    deleteButton.style.color = "white";
                    deleteButton.style.border = "none";
                    deleteButton.style.padding = "5px 10px";
                    deleteButton.style.cursor = "pointer";
                    deleteButton.style.borderRadius = "5px";

                    deleteButton.onclick = () => cancelAppointment(reservedAppointment);

                    optionContainer.appendChild(deleteButton);
                }
            } else {
                option.textContent = time;
                optionContainer.appendChild(option);
            }

            timeSelect.appendChild(optionContainer);
        });
    }

    async function cancelAppointment(appointment) {
        const confirmCancel = confirm(`Tem certeza que deseja cancelar o agendamento de ${appointment.client_name} às ${appointment.time}?`);
        
        if (!confirmCancel) return;

        try {
            const response = await fetch("https://franciscobarbearia.netlify.app/.netlify/functions/appointments", { // Substitua pela URL correta
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    client_name: appointment.client_name,
                    date: appointment.date,
                    time: appointment.time
                })
            });

            const result = await response.json();
            if (result.success) {
                alert("Agendamento cancelado com sucesso!");
                updateAvailableTimes(appointment.client_name); // Atualiza os horários disponíveis
            } else {
                alert("Erro ao cancelar o agendamento: " + result.error);
            }
        } catch (error) {
            alert("Erro ao conectar com o servidor.");
        }
    }
    */

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
                    text: `Agendamento para o dia ${selectedDate} às ${selectedTime}.`,
                    icon: 'success',
                    confirmButtonText: 'Ok',
                    timer: 5000,
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

    setAvailableDates();
    fetchReservedTimes();
});
