describe('Basic Navigation', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should load the homepage', () => {
    cy.get('[role="main"]').should('be.visible');
  });

  it('should display post items with user information', () => {
    // Check for post container
    cy.get('.post-container').should('exist');
    
    // Check for user info in posts
    cy.get('.flex.items-center.space-x-4').within(() => {
      // Avatar should exist
      cy.get('.h-10.w-10').should('exist');
      
      // Username should be visible
      cy.get('.text-lg.font-bold').should('exist');
    });

    // Check for post interaction elements
    cy.get('.flex.space-x-4').within(() => {
      // Like count
      cy.get('.text-red-500').should('exist');
      
      // Comment count
      cy.get('.text-gaming-400').should('exist');
      
      // Trophy/clip votes
      cy.get('.text-yellow-500').should('exist');
    });
  });

  it('should show post content', () => {
    cy.get('.relative.h-full.w-full').should('exist');
  });
});

describe('Post Interactions', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should display post interaction elements correctly', () => {
    cy.get('.flex.items-center.space-x-1').should('have.length.at.least', 3);
  });
});