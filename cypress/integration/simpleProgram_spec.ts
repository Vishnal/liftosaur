import { g } from "../support/utils";

describe("Program", () => {
  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.clearIndexedDb();
    cy.viewport("iphone-6");
  });

  it("creates a new exercise using Simple editor", () => {
    cy.visit("http://local.liftosaur.com:8080");

    // Creating the program

    cy.contains("Let's choose a program!").click();
    cy.contains("Create").click();

    g("modal-create-program-input").clear().type("My Program");
    g("modal-create-program-submit").click();

    cy.contains("Add Exercise +").click();

    g("select-exercise").click();
    g("modal-exercise").find("[data-cy='menu-item-deadlift']").click();
    g("menu-item-value-equipment").should("have.value", "barbell");

    cy.contains("Advanced").click();

    cy.contains("Add Variation +").click();

    cy.contains("Simple").click();

    g("simple-errors").should("contain.text", "Should only have one variation");

    cy.contains("Advanced").click();

    g("menu-item-value-variation").select("Variation 2");
    cy.contains("Remove Variation").click();

    cy.contains("Simple").click();

    g("sets-input").clear().type("5");
    g("reps-input").clear().type("3");
    g("weight-input").clear().type("80");

    cy.contains("Save").click();

    g("menu-item-day-1").find('[data-cy="edit-day"]').click();
    g("available-exercises").find("[data-cy=menu-item-deadlift]").click();
    g("selected-exercises").find("[data-cy=menu-item-deadlift]").should("exist");

    // Running the program

    cy.contains("Back").click();
    cy.contains("Back").click();

    g("menu-item-my-program").click();

    // Running the program

    cy.contains("Start New Workout").click();
    cy.contains("Got it!").click();

    g("set-nonstarted").should("have.length", 5);
    g("set-nonstarted").should("have.length", 5);
    g("set-nonstarted").eq(0).find("[data-cy=reps-value]").should("have.text", 3);
    g("set-nonstarted").eq(0).find("[data-cy=weight-value]").should("have.text", 80);
    g("set-nonstarted").eq(4).find("[data-cy=reps-value]").should("have.text", 3);
    g("set-nonstarted").eq(4).find("[data-cy=weight-value]").should("have.text", 80);
  });
});
