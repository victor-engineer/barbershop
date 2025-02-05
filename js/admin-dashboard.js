$(document).ready(function () {
    // Função para carregar os agendamentos via AJAX
    function loadAppointments() {
        fetch("http://localhost:8888/.netlify/functions/appointments")  // Atualize para o endpoint da API RESTful configurado em appointments.js
            .then((response) => response.json())
            .then((data) => {
                if (data.success) {
                    const tbody = $("#appointments-body");
                    tbody.empty(); // Limpa a tabela antes de adicionar os novos dados

                    data.appointments.forEach((appointment) => {
                        const appointmentTime = new Date(`${appointment.date} ${appointment.time}`);
                        const currentTime = new Date();

                        // Verificar se o horário já passou
                        if (appointmentTime < currentTime) {
                            // Deletar o agendamento automaticamente
                            deleteAppointment(appointment.id);
                        } else {
                            const row = `
                                <tr id="appointment-${appointment.id}">
                                    <td>${appointment.client_name}</td>
                                    <td>${appointment.date}</td>
                                    <td>${appointment.time}</td>
                                    <td>
                                        <a href="edit_appointment.js?id=${appointment.id}" class="btn btn-primary btn-sm">
                                            <i class="fas fa-edit"></i> Editar
                                        </a>
                                        <a href="delete_appointment.js?id=${appointment.id}" class="btn btn-danger btn-sm">
                                            <i class="fas fa-trash"></i> Excluir
                                        </a>
                                    </td>
                                </tr>`;
                            tbody.append(row);
                        }
                    });
                } else {
                    $("#response-message").html(
                        `<div class="alert alert-danger">${data.error}</div>`
                    );
                }
            })
            .catch((error) => console.error("Erro ao carregar agendamentos:", error));
    }

    // Função para excluir um agendamento
    function deleteAppointment(appointmentId) {
        fetch(`https://franciscobarbearia.netlify.app/delete_appointment?id=${appointmentId}`, {
            method: "DELETE",
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.success) {
                    alert("Agendamento excluído automaticamente por ter expirado.");
                    loadAppointments(); // Atualiza a lista de agendamentos
                } else {
                    console.error("Erro ao excluir agendamento:", data.error);
                }
            })
            .catch((error) => console.error("Erro ao excluir o agendamento:", error));
    }

    // Carrega os agendamentos assim que a página é carregada
    loadAppointments();

    // Lógica para adicionar um novo agendamento
    $("#booking-form").on("submit", function (event) {
        event.preventDefault();

        const clientName = $("#client_name").val();
        const date = $("#date").val();
        const time = $("#time").val();

        if (!clientName || !date || !time) {
            alert("Todos os campos são obrigatórios.");
            return;
        }

        // Verificar se o horário já está reservado
        checkAvailability(date, time)
            .then((isAvailable) => {
                if (isAvailable) {
                    // Se o horário estiver disponível, envia o agendamento
                    const data = { client_name: clientName, date, time };

                    fetch("https://franciscobarbearia.netlify.app/.netlify/functions/appointments", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(data),
                    })
                        .then((response) => response.json())
                        .then((data) => {
                            if (data.success) {
                                $("#response-message").html(
                                    `<div class="alert alert-success">Agendamento adicionado com sucesso!</div>`
                                );
                                $("#booking-form")[0].reset();
                                loadAppointments(); // Recarrega a lista de agendamentos
                            } else {
                                $("#response-message").html(
                                    `<div class="alert alert-danger">${data.error}</div>`
                                );
                            }
                        })
                        .catch((error) =>
                            console.error("Erro ao enviar o agendamento:", error)
                        );
                } else {
                    // Se o horário não estiver disponível
                    $("#response-message").html(
                        `<div class="alert alert-danger">Este horário já está reservado. Por favor, escolha outro horário.</div>`
                    );
                }
            })
            .catch((error) => {
                console.error("Erro ao verificar disponibilidade:", error);
            });
    });

    // Função para verificar a disponibilidade do horário
    function checkAvailability(date, time) {
        return new Promise((resolve, reject) => {
            fetch(`https://franciscobarbearia.netlify.app/.netlify/functions/appointments?date=${date}&time=${time}`)
                .then((response) => response.json())
                .then((data) => {
                    if (data.success) {
                        resolve(true); // Disponível
                    } else {
                        resolve(false); // Não disponível
                    }
                })
                .catch((error) => {
                    console.error("Erro ao verificar disponibilidade:", error);
                    reject(false);
                });
        });
    }

    // Lógica para excluir um agendamento
    $(document).on("click", ".btn-danger", function (event) {
        event.preventDefault();

        const appointmentId = $(this).attr("href").split("=")[1]; // Pega o ID da URL

        if (confirm("Tem certeza que deseja excluir este agendamento?")) {
            fetch(`https://franciscobarbearia.netlify.app/.netlify/functions/delete_appointment?id=${appointmentId}`, {
                method: "DELETE", // Corrigido o método
            })
                .then((response) => response.json())
                .then((data) => {
                    if (data.success) {
                        alert("Agendamento excluído com sucesso!");
                        loadAppointments(); // Atualiza a lista
                    } else {
                        alert(data.error || "Erro ao excluir o agendamento.");
                    }
                })
                .catch((error) => console.error("Erro ao excluir o agendamento:", error));
        }
    });

    // Verificar periodicamente se algum agendamento passou
    setInterval(loadAppointments, 60000); // A cada 60 segundos
});
