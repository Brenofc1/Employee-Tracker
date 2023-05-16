const connection = require('./config/connection');
const inquirer = require('inquirer');
const cTable = require('console.table');
const chalk = require('chalk');
const figlet = require('figlet');
const validate = require('./javascript/validate');

// Database Connect and Starter Title
connection.connect((error) => {
  if (error) throw error;
  promptUser();
});

// Prompt User for Choices
const promptUser = () => {
  inquirer.prompt([
    {
      name: 'choices',
      type: 'list',
      message: 'Please select an option:',
      choices: [
        'View All Employees',
        'View All Roles',
        'View All Departments',
        'View All Employees By Department',
        'View Department Budgets',
        'Update Employee Role',
        'Update Employee Manager',
        'Add Employee',
        'Add Role',
        'Add Department',
        'Remove Employee',
        'Remove Role',
        'Remove Department',
        'Exit'
      ]
    }
  ])
    .then((answers) => {
      const { choices } = answers;

      switch (choices) {
        case 'View All Employees':
          viewAllEmployees();
          break;

        case 'View All Roles':
          viewAllRoles();
          break;

        case 'View All Departments':
          viewAllDepartments();
          break;

        case 'View All Employees By Department':
          viewEmployeesByDepartment();
          break;

        case 'View Department Budgets':
          viewDepartmentBudget();
          break;

        case 'Update Employee Role':
          updateEmployeeRole();
          break;

        case 'Update Employee Manager':
          updateEmployeeManager();
          break;

        case 'Add Employee':
          addEmployee();
          break;

        case 'Add Role':
          addRole();
          break;

        case 'Add Department':
          addDepartment();
          break;

        case 'Remove Employee':
          removeEmployee();
          break;

        case 'Remove Role':
          removeRole();
          break;

        case 'Remove Department':
          removeDepartment();
          break;

        case 'Exit':
          connection.end();
          break;

        default:
          console.log('Invalid choice');
          break;
      }
  });
};
// ----------------------------------------------------- VIEW -----------------------------------------------------------------------

// View All Employees
const viewAllEmployees = () => {
  let sql =       `SELECT employee.id, 
                  employee.first_name, 
                  employee.last_name, 
                  role.title, 
                  department.department_name AS 'department', 
                  role.salary
                  FROM employee, role, department 
                  WHERE department.id = role.department_id 
                  AND role.id = employee.role_id
                  ORDER BY employee.id ASC`;
  connection.promise().query(sql, (error, response) => {
    if (error) throw error;
    console.log(chalk.yellow.bold(`====================================================================================`));
    console.log(`                              ` + chalk.green.bold(`Current Employees:`));
    console.log(chalk.yellow.bold(`====================================================================================`));
    console.table(response);
    console.log(chalk.yellow.bold(`====================================================================================`));
    promptUser();
  });
};

// View all Roles
const viewAllRoles = () => {
  console.log(chalk.yellow.bold(`====================================================================================`));
  console.log(`                              ` + chalk.green.bold(`Current Employee Roles:`));
  console.log(chalk.yellow.bold(`====================================================================================`));
  const sql =     `SELECT role.id, role.title, department.department_name AS department
                  FROM role
                  INNER JOIN department ON role.department_id = department.id`;
  connection.promise().query(sql, (error, response) => {
    if (error) throw error;
      response.forEach((role) => {console.log(role.title);});
      console.log(chalk.yellow.bold(`====================================================================================`));
      promptUser();
  });
};

// View all Departments
const viewAllDepartments = () => {
  const sql =   `SELECT department.id AS id, department.department_name AS department FROM department`; 
  connection.promise().query(sql, (error, response) => {
    if (error) throw error;
    console.log(chalk.yellow.bold(`====================================================================================`));
    console.log(`                              ` + chalk.green.bold(`All Departments:`));
    console.log(chalk.yellow.bold(`====================================================================================`));
    console.table(response);
    console.log(chalk.yellow.bold(`====================================================================================`));
    promptUser();
  });
};

// View all Employees by Department
const viewEmployeesByDepartment = () => {
  const sql =     `SELECT employee.first_name, 
                  employee.last_name, 
                  department.department_name AS department
                  FROM employee 
                  LEFT JOIN role ON employee.role_id = role.id 
                  LEFT JOIN department ON role.department_id = department.id`;
  connection.query(sql, (error, response) => {
    if (error) throw error;
      console.log(chalk.yellow.bold(`====================================================================================`));
      console.log(`                              ` + chalk.green.bold(`Employees by Department:`));
      console.log(chalk.yellow.bold(`====================================================================================`));
      console.table(response);
      console.log(chalk.yellow.bold(`====================================================================================`));
      promptUser();
    });
};

//View all Departments by Budget
const viewDepartmentBudget = () => {
  console.log(chalk.yellow.bold(`====================================================================================`));
  console.log(`                              ` + chalk.green.bold(`Budget By Department:`));
  console.log(chalk.yellow.bold(`====================================================================================`));
  const sql =     `SELECT department_id AS id, 
                  department.department_name AS department,
                  SUM(salary) AS budget
                  FROM  role  
                  INNER JOIN department ON role.department_id = department.id GROUP BY  role.department_id`;
  connection.query(sql, (error, response) => {
    if (error) throw error;
      console.table(response);
      console.log(chalk.yellow.bold(`====================================================================================`));
      promptUser();
  });
};

// --------------------------------------------------- ADD --------------------------------------------------------------------

// Add Employee
const addEmployee = () => {
  const sqlRoles = `SELECT id, title FROM role`;
  const sqlManagers = `SELECT id, CONCAT(first_name, ' ', last_name) AS name FROM employee`;

  Promise.all([
    connection.promise().query(sqlRoles),
    connection.promise().query(sqlManagers),
  ])
    .then(([rolesResponse, managersResponse]) => {
      const roles = rolesResponse[0];
      const managers = managersResponse[0];

      inquirer
        .prompt([
          {
            name: 'firstName',
            type: 'input',
            message: "What is the employee's first name?",
          },
          {
            name: 'lastName',
            type: 'input',
            message: "What is the employee's last name?",
          },
          {
            name: 'roleId',
            type: 'list',
            message: "What is the employee's role?",
            choices: roles.map((role) => ({ name: role.title, value: role.id })),
          },
          {
            name: 'managerOption',
            type: 'list',
            message: "Does the employee have a manager?",
            choices: [
              { name: "Yes, select existing manager", value: "existing" },
              { name: "No, create new manager", value: "new" },
            ],
          },
          {
            name: 'managerId',
            type: 'list',
            message: "Select the employee's manager:",
            choices: managers.map((manager) => ({ name: manager.name, value: manager.id })),
            when: (answers) => answers.managerOption === "existing",
          },
          {
            name: 'managerFirstName',
            type: 'input',
            message: "Enter the new manager's first name:",
            when: (answers) => answers.managerOption === "new",
          },
          {
            name: 'managerLastName',
            type: 'input',
            message: "Enter the new manager's last name:",
            when: (answers) => answers.managerOption === "new",
          },
        ])
        .then((answers) => {
          const { firstName, lastName, roleId, managerOption, managerId, managerFirstName, managerLastName } = answers;

          if (managerOption === "new") {
            const sql = `INSERT INTO employee (first_name, last_name, role_id) VALUES (?, ?, ?)`;
            connection.query(sql, [managerFirstName, managerLastName, roleId], (error, response) => {
              if (error) throw error;
              createEmployee(firstName, lastName, roleId, response.insertId);
            });
          } else {
            createEmployee(firstName, lastName, roleId, managerId);
          }
        });
    })
    .catch((error) => {
      throw error;
    });
};

const createEmployee = (firstName, lastName, roleId, managerId) => {
  const sql = `INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES (?, ?, ?, ?)`;
  connection.query(sql, [firstName, lastName, roleId, managerId], (error, response) => {
    if (error) throw error;
    console.log(chalk.green.bold('Employee added successfully!\n'));
    promptUser();
  });
};


// Add a New Role
const addRole = () => {
  const sql = 'SELECT * FROM department';
  connection.promise().query(sql, (error, response) => {
    if (error) throw error;
    let deptNamesArray = [];
    response.forEach((department) => {
      deptNamesArray.push(department.department_name);
    });
    deptNamesArray.push('Create Department');
    inquirer
      .prompt([
        {
          name: 'departmentName',
          type: 'list',
          message: 'Which department is this new role in?',
          choices: deptNamesArray
        }
      ])
      .then((answer) => {
        if (answer.departmentName === 'Create Department') {
          // Handle creating a new department
          inquirer
            .prompt([
              {
                name: 'newDepartment',
                type: 'input',
                message: 'Enter the name of the new department:',
                validate: validate.validateString,
              },
            ])
            .then((departmentAnswer) => {
              const sql = 'INSERT INTO department (department_name) VALUES (?)';
              const crit = [departmentAnswer.newDepartment];
              connection.query(sql, crit, (error, response) => {
                if (error) throw error;
                console.log(`${departmentAnswer.newDepartment} Department successfully created!\n`);
                viewAllDepartments();
              });
            });
        } else {
          // Handle adding a new role to an existing department
          inquirer
            .prompt([
              {
                name: 'newRole',
                type: 'input',
                message: 'What is the name of your new role?',
                validate: validate.validateString,
              },
              {
                name: 'salary',
                type: 'input',
                message: 'What is the salary of this new role?',
                validate: validate.validateSalary,
              },
            ])
            .then((roleAnswer) => {
              const createdRole = roleAnswer.newRole;
              let departmentId;
              response.forEach((department) => {
                if (answer.departmentName === department.department_name) {
                  departmentId = department.id;
                }
              });
              const sql =
                'INSERT INTO role (title, salary, department_id) VALUES (?, ?, ?)';
              const crit = [createdRole, roleAnswer.salary, departmentId];
              connection.query(sql, crit, (error) => {
                if (error) throw error;
                console.log(`Role successfully created!\n`);
                viewAllRoles();
              });
            });
        }
      });
  });
};

// Add a New Department
const addDepartment = () => {
  inquirer
    .prompt([
      {
        name: 'newDepartment',
        type: 'input',
        message: 'What is the name of your new Department?',
        validate: validate.validateString
      }
    ])
    .then((answer) => {
      let sql = `INSERT INTO department (department_name) VALUES (?)`;
      let crit = [answer.newDepartment];
      connection.query(sql, answer.newDepartment, (error, response) => {
        if (error) throw error;
        console.log(``);
        console.log(chalk.greenBright(answer.newDepartment + ` Department successfully created!`));
        console.log(``);
        viewAllDepartments();
      });
    });
};

// ------------------------------------------------- UPDATE -------------------------------------------------------------------------

// Update Employee Role
const updateEmployeeRole = () => {
  const sqlRoles = `SELECT id, title FROM role`;
  const sqlEmployees = `SELECT CONCAT(first_name, ' ', last_name) AS name FROM employee`;

  Promise.all([
    connection.promise().query(sqlRoles),
    connection.promise().query(sqlEmployees),
  ])
    .then(([rolesResponse, employeesResponse]) => {
      const roles = rolesResponse[0];
      const employees = employeesResponse[0];

      inquirer
        .prompt([
          {
            name: 'employee',
            type: 'list',
            message: 'Which employee has a new role?',
            choices: employees.map((employee) => employee.name),
          },
          {
            name: 'roleId',
            type: 'list',
            message: 'What is the new role ID for this employee?',
            choices: roles.map((role) => ({
              name: role.title,
              value: role.id,
            })),
          },
        ])
        .then((answers) => {
          const { employee, roleId } = answers;
          const [firstName, lastName] = employee.split(' ');

          const sql = `UPDATE employee SET role_id = ? WHERE first_name = ? AND last_name = ?`;
          connection.query(sql, [roleId, firstName, lastName], (error) => {
            if (error) throw error;
            console.log(chalk.green.bold('Employee role updated successfully!\n'));
            promptUser();
          });
        });
    })
    .catch((error) => {
      throw error;
    });
};

// Update an Employee's Manager
const updateEmployeeManager = () => {
  const sql = `SELECT employee.id, employee.first_name, employee.last_name, employee.manager_id
              FROM employee`;

  connection.promise()
    .query(sql)
    .then((response) => {
      const employees = response[0];

      inquirer
        .prompt([
          {
            name: 'chosenEmployee',
            type: 'list',
            message: 'Which employee has a new manager?',
            choices: employees.map((employee) => `${employee.first_name} ${employee.last_name}`),
          },
          {
            name: 'newManager',
            type: 'list',
            message: 'Who is their manager?',
            choices: employees.map((employee) => `${employee.first_name} ${employee.last_name}`),
          },
        ])
        .then((answers) => {
          const { chosenEmployee, newManager } = answers;
          const chosenEmployeeId = employees.find((employee) => `${employee.first_name} ${employee.last_name}` === chosenEmployee).id;
          const newManagerId = employees.find((employee) => `${employee.first_name} ${employee.last_name}` === newManager).id;

          if (chosenEmployeeId === newManagerId) {
            console.log(chalk.redBright.bold(`====================================================================================`));
            console.log(chalk.redBright(`Invalid Manager Selection`));
            console.log(chalk.redBright.bold(`====================================================================================`));
            promptUser();
          } else {
            const sql2 = `UPDATE employee SET manager_id = ? WHERE id = ?`;

            connection.query(sql2, [newManagerId, chosenEmployeeId], (error) => {
              if (error) throw error;
              console.log(chalk.greenBright.bold(`====================================================================================`));
              console.log(chalk.greenBright(`Employee Manager Updated`));
              console.log(chalk.greenBright.bold(`====================================================================================`));
              promptUser();
            });
          }
        });
    })
    .catch((error) => {
      throw error;
    });
};

// -------------------------------------- REMOVE --------------------------------------------------------

// Delete an Employee
const removeEmployee = () => {
  let sql = `SELECT employee.id, employee.first_name, employee.last_name FROM employee`;

  connection.promise()
    .query(sql)
    .then((response) => {
      const employeeNamesArray = response[0].map((employee) => `${employee.first_name} ${employee.last_name}`);

      inquirer
        .prompt([
          {
            name: 'chosenEmployee',
            type: 'list',
            message: 'Which employee would you like to remove?',
            choices: employeeNamesArray,
          },
        ])
        .then((answer) => {
          let employeeId;

          response[0].forEach((employee) => {
            if (
              answer.chosenEmployee ===
              `${employee.first_name} ${employee.last_name}`
            ) {
              employeeId = employee.id;
            }
          });

          let sql = `DELETE FROM employee WHERE employee.id = ?`;
          connection.query(sql, [employeeId], (error) => {
            if (error) throw error;
            console.log(chalk.redBright.bold(`====================================================================================`));
            console.log(chalk.redBright(`Employee Successfully Removed`));
            console.log(chalk.redBright.bold(`====================================================================================`));
            viewAllEmployees();
          });
        });
    })
    .catch((error) => {
      throw error;
    });
};

// Delete a Role
const removeRole = () => {
  const sqlRoles = `SELECT role.id, role.title FROM role`;
  const sqlEmployees = `SELECT employee.id, CONCAT(employee.first_name, ' ', employee.last_name) AS name FROM employee`;

  Promise.all([
    connection.promise().query(sqlRoles),
    connection.promise().query(sqlEmployees),
  ])
    .then(([rolesResponse, employeesResponse]) => {
      const roles = rolesResponse[0];
      const employees = employeesResponse[0];

      inquirer
        .prompt([
          {
            name: 'chosenRole',
            type: 'list',
            message: 'Which role would you like to remove?',
            choices: roles.map((role) => role.title),
          },
        ])
        .then((answer) => {
          const chosenRole = answer.chosenRole;
          const roleId = roles.find((role) => role.title === chosenRole).id;

          const employeesWithRole = employees.filter((employee) => employee.role_id === roleId);
          const employeeNames = employeesWithRole.map((employee) => employee.name);

          if (employeesWithRole.length > 0) {
            console.log(
              chalk.yellow.bold(
                'The following employees are currently assigned to this role:'
              )
            );
            console.log(chalk.yellow(employeeNames.join(', ')));
            console.log(
              chalk.yellow.bold(
                'Please reassign the employees to a different role before removing this role.'
              )
            );
            promptUser();
          } else {
            const sql = `DELETE FROM role WHERE role.id = ?`;
            connection.query(sql, [roleId], (error) => {
              if (error) throw error;
              console.log(chalk.redBright.bold('Role Successfully Removed'));
              viewAllRoles();
            });
          }
        });
    })
    .catch((error) => {
      throw error;
    });
};

// Delete a Department
const removeDepartment = () => {
  const sqlDepartments = `SELECT department.id, department.department_name FROM department`;

  connection.promise()
    .query(sqlDepartments)
    .then((response) => {
      const departments = response[0];
      
      inquirer
        .prompt([
          {
            name: 'chosenDepartment',
            type: 'list',
            message: 'Which department would you like to remove?',
            choices: departments.map((department) => department.department_name),
          },
        ])
        .then((answer) => {
          const chosenDepartment = answer.chosenDepartment;
          const departmentId = departments.find((department) => department.department_name === chosenDepartment).id;

          const sql = `DELETE FROM department WHERE department.id = ?`;
          connection.query(sql, [departmentId], (error) => {
            if (error) throw error;
            console.log(chalk.redBright.bold('Department Successfully Removed'));
            viewAllDepartments();
          });
        });
    })
    .catch((error) => {
      throw error;
    });
};