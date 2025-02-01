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

    let reservedTimes = []; // Inicializa o array de horários reservados

    // Função para formatar o horário no formato correto (hh:mm)
    function formatTime(time) {
        const [hour, minute] = time.split(':');
        return `${hour}:${minute}`; // Retorna no formato "08:00"
    }

    // Função para calcular e definir as datas disponíveis no input de data
    function setAvailableDates() {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        // Formatando a data para o formato aceito pelo input date (YYYY-MM-DD)
        const formatDate = (date) => date.toISOString().split("T")[0];

        const todayFormatted = formatDate(today);
        const tomorrowFormatted = formatDate(tomorrow);

        dateInput.setAttribute("min", todayFormatted);
        dateInput.setAttribute("max", tomorrowFormatted);
        dateInput.value = todayFormatted; // Define a data padrão como hoje
    }

    // Função para verificar se o horário já está reservado
    function isTimeReserved(selectedTime, selectedDate) {
        return reservedTimes.some(
            (reserved) => reserved.time === selectedTime && reserved.date === selectedDate
        );
    }

    // Função para atualizar os horários disponíveis
    function updateAvailableTimes() {
        timeSelect.innerHTML = ""; // Limpa as opções atuais
        const selectedDate = dateInput.value; // Obtém a data selecionada

        workingHours.forEach((time) => {
            const option = document.createElement("option");
            option.value = time;

            // Verifica se o horário está reservado
            const reservedAppointment = reservedTimes.find(reserved => reserved.time === time && reserved.date === selectedDate);

            if (reservedAppointment) {
                // Se estiver reservado, exibe como "Indisponível"
                option.textContent = `${time} - Indisponível`;
                option.disabled = true; // Desabilita a seleção
            } else {
                // Caso contrário, mantém o horário disponível
                option.textContent = time;
            }

            timeSelect.appendChild(option);
        });
    }

    // Função para carregar os horários reservados do servidor
    function fetchReservedTimes() {
        fetch('https://franciscobarbearia.netlify.app/admin/admin-dashboard.php')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Carrega as reservas corretamente, com o formato de horário padronizado
                    reservedTimes = data.appointments.map(appointment => ({
                        time: formatTime(appointment.time), // Formata o horário
                        date: appointment.date,
                        client_name: appointment.client_name
                    }));

                    console.log("Horários Reservados:", reservedTimes); // Debug para verificar se os dados estão corretos
                    updateAvailableTimes(); // Atualiza os horários no dropdown
                } else {
                    console.error('Erro ao carregar horários reservados', data.error);
                }
            })
            .catch(error => {
                console.error('Erro ao buscar horários reservados:', error);
            });
    }

    // Submissão do formulário
    bookingForm.addEventListener("submit", (event) => {
        event.preventDefault(); // Impede o envio padrão do formulário

        const name = nameInput.value.trim();
        const selectedDate = dateInput.value;
        const selectedTime = timeSelect.value;

        if (!name) {
            alert("Por favor, insira seu nome.");
            return;
        }

        // Verificar se o horário está disponível
        if (isTimeReserved(selectedTime, selectedDate)) {
            alert(`O horário ${selectedTime} já está reservado para o dia ${selectedDate}. Escolha outro horário.`);
            return;
        }

        // Adicionar o novo horário à lista de horários reservados
        reservedTimes.push({
            client_name: name,
            date: selectedDate,
            time: selectedTime
        });

        // Atualizar a interface com os horários disponíveis
        updateAvailableTimes();

        // Fazer a requisição para adicionar a reserva
        const appointmentData = {
            client_name: name,
            date: selectedDate,
            time: selectedTime
        };

        fetch('https://franciscobarbearia.netlify.app/admin/add_appointment.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(appointmentData)
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Reserva feita com sucesso');
                } else {
                    alert(data.error || 'Erro ao agendar a reserva');
                }
            })
            .catch(error => {
                alert('Erro ao fazer a requisição de reserva');
                console.error(error);
            });
    });

    // Chama a função para definir a data ao carregar a página
    setAvailableDates();

    // Chama a função para buscar os horários reservados logo após a data ser configurada
    fetchReservedTimes(); // Agora, não usamos setTimeout
});
