$(document).ready(function () {
    // Função para carregar os agendamentos via AJAX
    function loadAppointments() {
        fetch("https://franciscobarbearia.netlify.app/admin/admin-dashboard.php")
            .then((response) => response.json())
            .then((data) => {
                if (data.success) {
                    const tbody = $("#appointments-body");
                    tbody.empty(); // Limpa a tabela antes de adicionar os novos dados

                    data.appointments.forEach((appointment) => {
                        const row = `
                            <tr>
                                <td>${appointment.client_name}</td>
                                <td>${appointment.date}</td>
                                <td>${appointment.time}</td>
                                <td>
                                    <a href="edit_appointment.php?id=${appointment.id}" class="btn btn-primary btn-sm">
                                        <i class="fas fa-edit"></i> Editar
                                    </a>
                                    <a href="delete_appointment.php?id=${appointment.id}" class="btn btn-danger btn-sm">
                                        <i class="fas fa-trash"></i> Excluir
                                    </a>
                                </td>
                            </tr>`;
                        tbody.append(row);
                    });
                } else {
                    $("#response-message").html(
                        `<div class="alert alert-danger">${data.error}</div>`
                    );
                }
            })
            .catch((error) => console.error("Erro ao carregar agendamentos:", error));
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

        const data = { client_name: clientName, date, time };

        fetch("https://franciscobarbearia.netlify.app/admin/add_appointment.php", {
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
    });

    // Lógica para excluir um agendamento
    $(document).on("click", ".btn-danger", function (event) {
        event.preventDefault();

        const appointmentId = $(this).attr("href").split("=")[1]; // Pega o ID da URL

        if (confirm("Tem certeza que deseja excluir este agendamento?")) {
            fetch(`/admin/delete_appointment.php?id=${appointmentId}`, {
                method: "GET",
            })
                .then((response) => response.json())
                .then((data) => {
                    if (data.success) {
                        alert("Agendamento excluído com sucesso!");
                        loadAppointments(); // Atualiza a lista de agendamentos
                    } else {
                        alert("Erro ao excluir o agendamento.");
                    }
                })
                .catch((error) =>
                    console.error("Erro ao excluir o agendamento:", error)
                );
        }
    });
});
